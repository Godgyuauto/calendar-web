import type { ShiftOverride } from "@/modules/shift";
import type { FamilyAuthContext } from "../_common/auth-context";
import {
  assertSupabaseResponseOk,
  buildSupabaseHeaders,
  buildSupabaseUrl,
} from "../_common/family-supabase-common";
import { buildStructuredOverrideNotificationBody } from "../overrides/structured-override-notification";
import type { TelegramOverrideLabels } from "./telegram-override-labels";

interface OverrideNoteLike {
  remind_at?: unknown;
}

interface QueueDispatchResult {
  queued: boolean;
  reason?: "NO_REMINDER" | "MISSING_ID";
}

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseReminderIso(note: string | null | undefined): string | null {
  if (!note) {
    return null;
  }

  try {
    const parsed = JSON.parse(note) as OverrideNoteLike;
    if (typeof parsed.remind_at !== "string") {
      return null;
    }

    const raw = parsed.remind_at.trim();
    if (!raw) {
      return null;
    }

    // Structured UI stores datetime-local (`YYYY-MM-DDTHH:mm`) without zone.
    // Treat it as Seoul local time to keep reminder intent stable.
    if (DATETIME_LOCAL_PATTERN.test(raw)) {
      return `${raw}:00+09:00`;
    }

    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  } catch {
    return null;
  }
}

function buildQueueTitle(payload: ReturnType<typeof buildStructuredOverrideNotificationBody>): string {
  return `일정 알림 · ${payload.title}`;
}

function buildQueueBody(payload: ReturnType<typeof buildStructuredOverrideNotificationBody>): string {
  // Store machine-readable payload in DB so downstream dispatch/trigger can
  // branch by event_type / shift_change without parsing free-form text.
  return JSON.stringify(payload);
}

export async function queueNotificationForOverride(
  auth: FamilyAuthContext,
  override: ShiftOverride,
  labels?: TelegramOverrideLabels,
): Promise<QueueDispatchResult> {
  if (!override.id) {
    return { queued: false, reason: "MISSING_ID" };
  }

  const remindAt = parseReminderIso(override.note);
  if (!remindAt) {
    return { queued: false, reason: "NO_REMINDER" };
  }

  const bodyPayload = buildStructuredOverrideNotificationBody(override, labels);
  const dedupeKey = `override:${override.id}:${remindAt}`;
  const query = new URLSearchParams({ on_conflict: "family_id,dedupe_key" });
  const response = await fetch(buildSupabaseUrl(`/rest/v1/notification_jobs?${query.toString()}`), {
    method: "POST",
    headers: buildSupabaseHeaders(auth, "resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify([
      {
        family_id: auth.familyId,
        event_id: null,
        channel: "telegram",
        title: buildQueueTitle(bodyPayload),
        body: buildQueueBody(bodyPayload),
        remind_at: remindAt,
        dedupe_key: dedupeKey,
        status: "pending",
        last_error: null,
        notified_at: null,
      },
    ]),
    cache: "no-store",
  });

  await assertSupabaseResponseOk(response, "Failed to queue notification.");
  return { queued: true };
}

export async function removeQueuedNotificationsForOverride(
  auth: FamilyAuthContext,
  overrideId: string,
): Promise<void> {
  const query = new URLSearchParams({
    family_id: `eq.${auth.familyId}`,
    dedupe_key: `like.override:${overrideId}:%`,
  });
  const response = await fetch(buildSupabaseUrl(`/rest/v1/notification_jobs?${query.toString()}`), {
    method: "DELETE",
    headers: buildSupabaseHeaders(auth, "return=minimal"),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to remove queued notifications.");
}
