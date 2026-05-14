import { revalidatePath } from "next/cache";
import {
  createShiftOverrideInSupabase,
  updateShiftOverrideInSupabase,
} from "./family-overrides-supabase";
import { getFamilyRepositoryFailure } from "../_common/family-supabase-common";
import type { FamilyAuthContext } from "../_common/auth-context";
import type { ApiLogScope } from "../_common/request-log";
import {
  responseForFailure,
  responseForSuccess,
} from "../_common/route-log-response";
import { broadcastFamilyCalendarChange } from "../_common/family-realtime-broadcast";
import { dispatchFamilyPush } from "../push/push-notify-dispatch";
import {
  dispatchQueuedNotificationCleanupForOverride,
  dispatchQueuedNotificationForOverride,
} from "../notifications/notification-jobs-dispatch";
import {
  dispatchTelegramMutationForOverride,
} from "../notifications/telegram-registration-dispatch";
import { resolveTelegramOverrideLabels } from "../notifications/telegram-override-labels";
import { parseOverrideMutationBody } from "./override-route-payload";
import { invalidateHomeFamilyCacheForFamily } from "@/modules/home/home-family-cache";
import type { ShiftOverride } from "@/modules/shift";

async function applyOverrideMutationSideEffects(
  logScope: ApiLogScope,
  auth: FamilyAuthContext,
  override: ShiftOverride,
  mode: "create" | "update",
): Promise<void> {
  const mutationLabels = await resolveTelegramOverrideLabels(auth, override, {
    actorUserId: auth.userId,
  });
  const queuedReminderLabels = await resolveTelegramOverrideLabels(auth, override, {
    actorUserId: override.createdBy ?? auth.userId,
  });
  if (mode === "update" && override.id) {
    // Reschedule reminder after edit: clear stale jobs, then enqueue with latest note/remind_at.
    await dispatchQueuedNotificationCleanupForOverride(logScope, auth, override.id);
  }
  await dispatchQueuedNotificationForOverride(logScope, auth, override, queuedReminderLabels);
  await dispatchTelegramMutationForOverride(logScope, auth, override, {
    ...mutationLabels,
    mode,
  });
  await dispatchFamilyPush(logScope, auth, {
    title: mode === "create" ? "근무 오버라이드 등록" : "근무 오버라이드 수정",
    body: `${override.date} · ${override.label}`,
    tag: mode === "create" ? "shift-override-created" : "shift-override-updated",
    url: "/",
  });
  invalidateHomeFamilyCacheForFamily(auth.familyId);
  revalidatePath("/");
  revalidatePath("/calendar");
  await broadcastFamilyCalendarChange(auth, "override");
}

function responseForOverrideMutationError(
  logScope: ApiLogScope,
  auth: FamilyAuthContext,
  error: unknown,
) {
  const failure = getFamilyRepositoryFailure(error);
  if (failure) {
    return responseForFailure(
      logScope,
      failure.status,
      failure.message,
      "REPOSITORY",
      auth,
    );
  }

  return responseForFailure(
    logScope,
    400,
    error instanceof Error ? error.message : "Invalid payload.",
    "VALIDATION",
    auth,
  );
}

export async function handleOverrideCreate(
  logScope: ApiLogScope,
  auth: FamilyAuthContext,
  body: unknown,
) {
  try {
    const input = parseOverrideMutationBody(body);
    const created = await createShiftOverrideInSupabase(auth, {
      userId: input.userId,
      date: input.date,
      overrideType: input.overrideType,
      overrideShift: input.overrideShift,
      label: input.label,
      note: input.note,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    await applyOverrideMutationSideEffects(logScope, auth, created, "create");
    return responseForSuccess(logScope, { override: created }, 201, auth);
  } catch (error) {
    return responseForOverrideMutationError(logScope, auth, error);
  }
}

export async function handleOverrideUpdate(
  logScope: ApiLogScope,
  auth: FamilyAuthContext,
  body: unknown,
) {
  const id = typeof (body as { id?: unknown })?.id === "string"
    ? (body as { id: string }).id.trim()
    : "";
  if (!id) {
    return responseForFailure(logScope, 400, "id is required.", "VALIDATION", auth);
  }

  try {
    const input = parseOverrideMutationBody(body);
    const updated = await updateShiftOverrideInSupabase(auth, {
      id,
      userId: input.userId,
      date: input.date,
      overrideType: input.overrideType,
      overrideShift: input.overrideShift,
      label: input.label,
      note: input.note,
      startTime: input.startTime,
      endTime: input.endTime,
    });
    if (!updated) {
      return responseForFailure(logScope, 404, "Not found.", "NOT_FOUND", auth);
    }

    await applyOverrideMutationSideEffects(logScope, auth, updated, "update");
    return responseForSuccess(logScope, { override: updated }, 200, auth);
  } catch (error) {
    return responseForOverrideMutationError(logScope, auth, error);
  }
}
