import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveFamilyAuthOrResponseWithCookie } from "../_common/route-auth";
import {
  listShiftOverridesFromSupabase,
  removeShiftOverrideInSupabase,
} from "./family-overrides-supabase";
import { getFamilyRepositoryFailure } from "../_common/family-supabase-common";
import { startApiLog } from "../_common/request-log";
import {
  logUnexpectedFailure,
  responseForAuthFailure,
  responseForFailure,
  responseForNoContent,
  responseForSuccess,
} from "../_common/route-log-response";
import { dispatchFamilyPush } from "../push/push-notify-dispatch";
import { dispatchQueuedNotificationCleanupForOverride } from "../notifications/notification-jobs-dispatch";
import { handleOverrideCreate, handleOverrideUpdate } from "./override-mutation-route";
import { invalidateHomeFamilyCacheForFamily } from "@/modules/home/home-family-cache";

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
  const scopeParam = request.nextUrl.searchParams.get("scope");
  const year = yearParam ? Number(yearParam) : undefined;
  const month = monthParam ? Number(monthParam) : undefined;
  const scope = scopeParam === "mine" ? "mine" : "family";

  try {
    const overrides = await listShiftOverridesFromSupabase(auth, {
      year: Number.isInteger(year) ? year : undefined,
      month: Number.isInteger(month) ? month : undefined,
      scope,
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

  return handleOverrideCreate(logScope, auth, await request.json());
}

export async function PATCH(request: NextRequest) {
  const logScope = startApiLog("/api/overrides", "PATCH");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  return handleOverrideUpdate(logScope, auth, await request.json());
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
