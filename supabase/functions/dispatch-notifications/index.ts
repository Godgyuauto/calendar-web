// @ts-expect-error Deno requires explicit .ts extension for Supabase Edge Function imports.
import { buildTelegramTextForNotificationJob } from "./telegram-text.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

type Config = { supabaseUrl: string; serviceRoleKey: string; telegramBotToken: string; telegramChatId: string; dispatchSecret?: string; batchSize: number; maxAttempts: number; dryRun: boolean };

type NotificationJob = {
  id: string;
  family_id: string;
  title: string;
  body: string;
  remind_at: string;
  dedupe_key: string;
};
type ShiftOverrideRow = { id: string; note: string | null };

const TIME_ZONE = "Asia/Seoul";
const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function readRequiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing ${name}.`);
  return value;
}

function readNumberEnv(name: string, fallback: number): number {
  const value = Number(Deno.env.get(name));
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}

function readConfig(): Config {
  return {
    supabaseUrl: readRequiredEnv("SUPABASE_URL").replace(/\/+$/, ""),
    serviceRoleKey: readRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    telegramBotToken: readRequiredEnv("TELEGRAM_BOT_TOKEN"),
    telegramChatId: readRequiredEnv("TELEGRAM_CHAT_ID"),
    dispatchSecret: Deno.env.get("NOTIFICATION_DISPATCH_SECRET")?.trim(),
    batchSize: readNumberEnv("NOTIFICATION_BATCH_SIZE", 25),
    maxAttempts: readNumberEnv("NOTIFICATION_MAX_ATTEMPTS", 5),
    dryRun: Deno.env.get("NOTIFICATION_DRY_RUN") === "true",
  };
}

function buildHeaders(config: Config, prefer?: string): HeadersInit {
  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function sanitizeError(error: unknown): string {
  const message = error instanceof Error ? error.message : "Unknown notification failure.";
  return message.replace(Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "", "[redacted]").slice(0, 480);
}

async function readResponseText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 240);
  } catch { return ""; }
}

async function claimJobs(config: Config): Promise<NotificationJob[]> {
  const response = await fetch(`${config.supabaseUrl}/rest/v1/rpc/claim_due_notification_jobs`, {
    method: "POST",
    headers: buildHeaders(config),
    body: JSON.stringify({ batch_size: config.batchSize, max_attempts: config.maxAttempts }),
  });

  if (!response.ok) {
    throw new Error(`Failed to claim notification jobs. ${await readResponseText(response)}`);
  }

  const json = (await response.json()) as unknown;
  return Array.isArray(json) ? (json as NotificationJob[]) : [];
}

async function listDueJobs(config: Config): Promise<NotificationJob[]> {
  const query = new URLSearchParams({
    select: "id,family_id,title,body,remind_at,attempt_count,dedupe_key",
    status: "in.(pending,failed)",
    remind_at: `lte.${new Date().toISOString()}`,
    order: "remind_at.asc",
    limit: String(config.batchSize),
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/notification_jobs?${query}`, {
    method: "GET",
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    throw new Error(`Failed to list notification jobs. ${await readResponseText(response)}`);
  }

  const json = (await response.json()) as unknown;
  return Array.isArray(json) ? (json as NotificationJob[]) : [];
}

async function updateJob(
  config: Config,
  jobId: string,
  patch: Record<string, string | null>,
): Promise<void> {
  const query = new URLSearchParams({ id: `eq.${jobId}` });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/notification_jobs?${query}`, {
    method: "PATCH",
    headers: buildHeaders(config, "return=minimal"),
    body: JSON.stringify({ ...patch, locked_at: null }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update notification job. ${await readResponseText(response)}`);
  }
}

function normalizeReminderIso(raw: string | null | undefined): string | null {
  if (!raw) {
    return null;
  }
  const value = raw.trim();
  if (!value) {
    return null;
  }

  if (DATETIME_LOCAL_PATTERN.test(value)) {
    return `${value}:00+09:00`;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function extractOverrideIdFromDedupeKey(dedupeKey: string): string | null {
  const match = /^override:([0-9a-f-]{36}):/i.exec(dedupeKey);
  return match?.[1] ?? null;
}

async function fetchShiftOverride(
  config: Config,
  familyId: string,
  overrideId: string,
): Promise<ShiftOverrideRow | null> {
  const query = new URLSearchParams({
    select: "id,note",
    id: `eq.${overrideId}`,
    family_id: `eq.${familyId}`,
    limit: "1",
  });
  const response = await fetch(`${config.supabaseUrl}/rest/v1/shift_overrides?${query.toString()}`, {
    method: "GET",
    headers: buildHeaders(config),
  });

  if (!response.ok) {
    throw new Error(`Failed to verify override source. ${await readResponseText(response)}`);
  }

  const json = (await response.json()) as unknown;
  if (!Array.isArray(json) || json.length === 0) {
    return null;
  }
  return json[0] as ShiftOverrideRow;
}

function readReminderFromOverrideNote(note: string | null): string | null {
  if (!note) {
    return null;
  }
  try {
    const parsed = JSON.parse(note) as { remind_at?: unknown };
    if (typeof parsed.remind_at !== "string") {
      return null;
    }
    return normalizeReminderIso(parsed.remind_at);
  } catch {
    return null;
  }
}

async function shouldSendJob(config: Config, job: NotificationJob): Promise<boolean> {
  const overrideId = extractOverrideIdFromDedupeKey(job.dedupe_key);
  if (!overrideId) {
    // Non-override jobs keep legacy behavior.
    return true;
  }

  const source = await fetchShiftOverride(config, job.family_id, overrideId);
  if (!source) {
    return false;
  }

  const sourceReminder = readReminderFromOverrideNote(source.note);
  const jobReminder = normalizeReminderIso(job.remind_at);
  if (!sourceReminder || !jobReminder) {
    return false;
  }

  // Final AND guard before send:
  // 1) override row still exists
  // 2) reminder in source note is still the same schedule as queued job
  return sourceReminder === jobReminder;
}

async function sendTelegram(config: Config, job: NotificationJob): Promise<void> {
  const response = await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: config.telegramChatId,
      text: buildTelegramTextForNotificationJob(job),
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Telegram send failed. ${await readResponseText(response)}`);
  }
}

function isAuthorized(request: Request, config: Config): boolean {
  if (!config.dispatchSecret) return true;
  const header = request.headers.get("authorization") ?? "";
  return header.replace(/^Bearer\s+/i, "").trim() === config.dispatchSecret;
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    const config = readConfig();
    if (!isAuthorized(request, config)) {
      return jsonResponse({ ok: false, error: "Unauthorized." }, 401);
    }

    if (config.dryRun) {
      const due = await listDueJobs(config);
      return jsonResponse({ ok: true, dryRun: true, due: due.length, timeZone: TIME_ZONE });
    }

    const jobs = await claimJobs(config);
    let sent = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        const sendAllowed = await shouldSendJob(config, job);
        if (!sendAllowed) {
          await updateJob(config, job.id, {
            status: "failed",
            last_error: "SKIPPED_SOURCE_MISMATCH_OR_DELETED",
          });
          failed += 1;
          continue;
        }
        await sendTelegram(config, job);
        await updateJob(config, job.id, { status: "sent", notified_at: new Date().toISOString(), last_error: null });
        sent += 1;
      } catch (error) {
        await updateJob(config, job.id, { status: "failed", last_error: sanitizeError(error) });
        failed += 1;
      }
    }

    return jsonResponse({ ok: failed === 0, claimed: jobs.length, sent, failed, timeZone: TIME_ZONE });
  } catch (error) {
    return jsonResponse({ ok: false, error: sanitizeError(error), timeZone: TIME_ZONE }, 503);
  }
}

Deno.serve(handleRequest);
