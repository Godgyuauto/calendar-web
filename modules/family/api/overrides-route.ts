import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/route-auth";
import {
  createShiftOverrideInSupabase,
  listShiftOverridesFromSupabase,
  removeShiftOverrideInSupabase,
} from "@/modules/family/api/family-overrides-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import { startApiLog } from "@/modules/family/api/request-log";
import {
  logUnexpectedFailure,
  responseForAuthFailure,
  responseForFailure,
  responseForNoContent,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";
import { OverrideType, ShiftCode } from "@/modules/shift";
import { dispatchFamilyPush } from "@/modules/family/api/push-notify-dispatch";
import {
  dispatchQueuedNotificationCleanupForOverride,
  dispatchQueuedNotificationForOverride,
} from "@/modules/family/api/notification-jobs-dispatch";
import { invalidateHomeFamilyCacheForFamily } from "@/modules/home/home-family-cache";

const ALLOWED_OVERRIDE_TYPES: OverrideType[] = [
  "vacation",
  "training",
  "swap",
  "extra",
  "sick",
  "business",
  "custom",
];

const ALLOWED_SHIFT_CODES: ShiftCode[] = ["A", "B", "C", "OFF"];

export async function GET(request: NextRequest) {
  const logScope = startApiLog("/api/overrides", "GET");
  // Calendar UI writes with credentials: "include" and may omit Authorization
  // header. Keep browser calls working by allowing cookie-token fallback here.
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const yearParam = request.nextUrl.searchParams.get("year");
  const monthParam = request.nextUrl.searchParams.get("month");
  const year = yearParam ? Number(yearParam) : undefined;
  const month = monthParam ? Number(monthParam) : undefined;

  try {
    const overrides = await listShiftOverridesFromSupabase(auth, {
      year: Number.isInteger(year) ? year : undefined,
      month: Number.isInteger(month) ? month : undefined,
    });

    return responseForSuccess(logScope, { overrides }, 200, auth);
  } catch (error) {
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

    logUnexpectedFailure(logScope, error, auth);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/overrides", "POST");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const body = await request.json();
  const overrideType = body.overrideType as OverrideType;
  const overrideShift = body.overrideShift as ShiftCode | null;

  if (!ALLOWED_OVERRIDE_TYPES.includes(overrideType)) {
    return responseForFailure(logScope, 400, "overrideType is invalid.", "VALIDATION", auth);
  }

  if (overrideShift !== null && !ALLOWED_SHIFT_CODES.includes(overrideShift)) {
    return responseForFailure(
      logScope,
      400,
      "overrideShift must be A|B|C|OFF|null.",
      "VALIDATION",
      auth,
    );
  }

  try {
    const created = await createShiftOverrideInSupabase(auth, {
      date: String(body.date ?? ""),
      overrideType,
      overrideShift,
      label: String(body.label ?? ""),
      note: typeof body.note === "string" ? body.note : undefined,
      startTime: typeof body.startTime === "string" ? body.startTime : undefined,
      endTime: typeof body.endTime === "string" ? body.endTime : undefined,
    });
    await dispatchQueuedNotificationForOverride(logScope, auth, created);
    await dispatchFamilyPush(logScope, auth, {
      title: "근무 오버라이드 등록",
      body: `${created.date} · ${created.label}`,
      tag: "shift-override-created",
      url: "/",
    });
    invalidateHomeFamilyCacheForFamily(auth.familyId);
    revalidatePath("/");
    revalidatePath("/calendar");

    return responseForSuccess(logScope, { override: created }, 201, auth);
  } catch (error) {
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
}

export async function DELETE(request: NextRequest) {
  const logScope = startApiLog("/api/overrides", "DELETE");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return responseForFailure(logScope, 400, "id is required.", "VALIDATION", auth);
  }

  try {
    const removed = await removeShiftOverrideInSupabase(auth, id);
    if (!removed) {
      return responseForFailure(logScope, 404, "Not found.", "NOT_FOUND", auth);
    }
    await dispatchQueuedNotificationCleanupForOverride(logScope, auth, id);
    await dispatchFamilyPush(logScope, auth, {
      title: "근무 오버라이드 삭제",
      body: "오버라이드 1건이 삭제되었습니다.",
      tag: "shift-override-deleted",
      url: "/",
    });
    invalidateHomeFamilyCacheForFamily(auth.familyId);
    revalidatePath("/");
    revalidatePath("/calendar");

    return responseForNoContent(logScope, 204, auth);
  } catch (error) {
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

    logUnexpectedFailure(logScope, error, auth);
    throw error;
  }
}

// TODO(auth): Use Supabase server client helper once shared infra module is introduced.
