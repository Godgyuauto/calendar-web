import type { FamilyAuthContext } from "@/modules/family/api/auth-context";
import {
  type ApiLogScope,
  logApiFailure,
} from "@/modules/family/api/request-log";
import {
  sendFamilyPushNotification,
} from "@/modules/family/api/push-notifier";

interface PushDispatchMessage {
  title: string;
  body: string;
  tag: string;
  url?: string;
}

export async function dispatchFamilyPush(
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  message: PushDispatchMessage,
): Promise<void> {
  try {
    const result = await sendFamilyPushNotification({
      familyId: auth.familyId,
      actorUserId: auth.userId,
      title: message.title,
      body: message.body,
      tag: message.tag,
      url: message.url,
    });

    if (result.skipped) {
      if (result.failureCode) {
        logApiFailure(scope, {
          status: 202,
          errorCode: result.failureCode,
          message: result.reason ?? "Push dispatch skipped.",
          familyId: auth.familyId,
          userId: auth.userId,
        });
      }
      return;
    }

    if (result.failed === 0) {
      return;
    }

    const failureSummary = result.failures
      .map((failure) => `${failure.code}:${failure.count}`)
      .join(",");

    logApiFailure(scope, {
      status: 207,
      errorCode: "PUSH_PARTIAL",
      message:
        `push failed=${result.failed}, sent=${result.sent}, ` +
        `cleaned=${result.cleaned}, cleanupFailed=${result.cleanupFailed}, ` +
        `codes=${failureSummary}`,
      familyId: auth.familyId,
      userId: auth.userId,
    });
  } catch (error) {
    logApiFailure(scope, {
      status: 503,
      errorCode: "PUSH_FAILED",
      message: error instanceof Error ? error.message : "Push dispatch failed.",
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}
