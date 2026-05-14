import type { ShiftOverride } from "@/modules/shift";
import type { FamilyAuthContext } from "../_common/auth-context";
import {
  logApiFailure,
  type ApiLogScope,
} from "../_common/request-log";
import {
  queueNotificationForOverride,
  removeQueuedNotificationsForOverride,
} from "./notification-jobs-supabase";
import type { TelegramOverrideLabels } from "./telegram-override-labels";

export async function dispatchQueuedNotificationForOverride(
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  createdOverride: ShiftOverride,
  labels?: TelegramOverrideLabels,
): Promise<void> {
  try {
    const queueResult = await queueNotificationForOverride(auth, createdOverride, labels);
    if (!queueResult.queued && queueResult.reason === "MISSING_ID") {
      logApiFailure(scope, {
        status: 202,
        errorCode: "NOTIFY_QUEUE_SKIP",
        message: "override id is missing; notification queue skipped.",
        familyId: auth.familyId,
        userId: auth.userId,
      });
    }
  } catch (queueError) {
    logApiFailure(scope, {
      status: 202,
      errorCode: "NOTIFY_QUEUE_FAILED",
      message:
        queueError instanceof Error
          ? queueError.message
          : "Failed to queue override notification.",
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}

export async function dispatchQueuedNotificationCleanupForOverride(
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  overrideId: string,
): Promise<void> {
  try {
    await removeQueuedNotificationsForOverride(auth, overrideId);
  } catch (queueError) {
    logApiFailure(scope, {
      status: 202,
      errorCode: "NOTIFY_QUEUE_CLEANUP_FAILED",
      message:
        queueError instanceof Error
          ? queueError.message
          : "Failed to cleanup queued notifications.",
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}
