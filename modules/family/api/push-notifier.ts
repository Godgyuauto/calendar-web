import webpush, { type PushSubscription } from "web-push";
import {
  deletePushSubscriptionByEndpoint,
  listFamilyPushSubscriptions,
} from "@/modules/family/api/push-subscriptions-repository";
import {
  addPushFailureSummary,
  classifyPushPayload,
  classifyPushSendFailure,
  type PushFailure,
  type PushFailureSummary,
} from "@/modules/family/api/push-failure";

interface PushConfig {
  publicKey: string;
  privateKey: string;
  subject: string;
}

export interface FamilyPushMessage {
  familyId: string;
  title: string;
  body: string;
  tag: string;
  actorUserId?: string;
  url?: string;
}

export interface FamilyPushResult {
  skipped: boolean;
  reason?: string;
  failureCode?: PushFailure["code"];
  sent: number;
  failed: number;
  cleaned: number;
  cleanupFailed: number;
  failures: PushFailureSummary[];
}

let webPushConfigured = false;

function getPushConfig(): PushConfig | null {
  const publicKey =
    process.env.WEB_PUSH_VAPID_PUBLIC_KEY?.trim() ??
    process.env.NEXT_PUBLIC_WEB_PUSH_PUBLIC_KEY?.trim();
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY?.trim();
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT?.trim();

  if (!publicKey || !privateKey || !subject) {
    return null;
  }

  return { publicKey, privateKey, subject };
}

function ensureWebPushConfigured(config: PushConfig): void {
  if (webPushConfigured) {
    return;
  }

  webpush.setVapidDetails(config.subject, config.publicKey, config.privateKey);
  webPushConfigured = true;
}

async function sendOnePush(
  subscription: PushSubscription,
  payload: string,
): Promise<{ ok: true } | { ok: false; failure: PushFailure }> {
  try {
    await webpush.sendNotification(subscription, payload, { TTL: 60 });
    return { ok: true };
  } catch (error) {
    const failure = classifyPushSendFailure(error);
    if (!failure.retryable) {
      return { ok: false, failure };
    }

    await waitForRetry();
    try {
      await webpush.sendNotification(subscription, payload, { TTL: 60 });
      return { ok: true };
    } catch (retryError) {
      return { ok: false, failure: classifyPushSendFailure(retryError) };
    }
  }
}

function waitForRetry(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 250));
}

export async function sendFamilyPushNotification(
  message: FamilyPushMessage,
): Promise<FamilyPushResult> {
  const config = getPushConfig();
  if (!config) {
    return {
      skipped: true,
      reason: "WEB_PUSH_VAPID_PUBLIC_KEY/PRIVATE_KEY/SUBJECT are not configured.",
      failureCode: "PUSH_CONFIG_MISSING",
      sent: 0,
      failed: 0,
      cleaned: 0,
      cleanupFailed: 0,
      failures: [],
    };
  }

  ensureWebPushConfigured(config);

  const rows = await listFamilyPushSubscriptions(message.familyId);
  const targets = rows.filter((row) => row.user_id !== message.actorUserId);
  if (targets.length === 0) {
    return {
      skipped: true,
      reason: "No push subscribers in family.",
      sent: 0,
      failed: 0,
      cleaned: 0,
      cleanupFailed: 0,
      failures: [],
    };
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    tag: message.tag,
    url: message.url ?? "/",
    familyId: message.familyId,
    at: new Date().toISOString(),
  });
  const payloadFailure = classifyPushPayload(payload);
  if (payloadFailure) {
    return {
      skipped: false,
      sent: 0,
      failed: targets.length,
      cleaned: 0,
      cleanupFailed: 0,
      failures: [
        {
          code: payloadFailure.code,
          count: targets.length,
          retryable: payloadFailure.retryable,
          cleaned: 0,
          cleanupFailed: 0,
        },
      ],
    };
  }

  let sent = 0;
  let failed = 0;
  let cleaned = 0;
  let cleanupFailed = 0;
  const failures: PushFailureSummary[] = [];

  for (const row of targets) {
    const result = await sendOnePush(
      {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      },
      payload,
    );

    if (result.ok) {
      sent += 1;
      continue;
    }

    failed += 1;
    const cleanup = { cleaned: false, cleanupFailed: false };
    if (result.failure.shouldDeleteSubscription) {
      try {
        await deletePushSubscriptionByEndpoint(message.familyId, row.endpoint);
        cleaned += 1;
        cleanup.cleaned = true;
      } catch {
        cleanupFailed += 1;
        cleanup.cleanupFailed = true;
      }
    }
    addPushFailureSummary(failures, result.failure, cleanup);
  }

  return {
    skipped: false,
    sent,
    failed,
    cleaned,
    cleanupFailed,
    failures,
  };
}
