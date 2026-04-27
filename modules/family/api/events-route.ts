import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { resolveFamilyAuthOrResponse } from "@/modules/family/api/route-auth";
import {
  createFamilyEventInSupabase,
  listFamilyEventsFromSupabase,
  removeFamilyEventInSupabase,
  updateFamilyEventInSupabase,
} from "@/modules/family/api/family-events-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import { startApiLog } from "@/modules/family/api/request-log";
import {
  logUnexpectedFailure,
  responseForAuthFailure,
  responseForFailure,
  responseForNoContent,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";
import { dispatchFamilyPush } from "@/modules/family/api/push-notify-dispatch";
import { invalidateHomeFamilyCacheForFamily } from "@/modules/home/home-family-cache";

export async function GET(request: NextRequest) {
  const logScope = startApiLog("/api/events", "GET");
  const auth = await resolveFamilyAuthOrResponse(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const routineParam = request.nextUrl.searchParams.get("isRoutine");
  const isRoutine = routineParam === null ? undefined : routineParam === "true";

  try {
    const events = await listFamilyEventsFromSupabase(auth, { isRoutine });
    return responseForSuccess(logScope, { events }, 200, auth);
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
  const logScope = startApiLog("/api/events", "POST");
  const auth = await resolveFamilyAuthOrResponse(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const body = await request.json();

  try {
    const created = await createFamilyEventInSupabase(auth, {
      title: String(body.title ?? ""),
      startTime: String(body.startTime ?? ""),
      endTime: String(body.endTime ?? ""),
      isRoutine: Boolean(body.isRoutine),
    });
    await dispatchFamilyPush(logScope, auth, {
      title: "가족 일정 등록",
      body: created.title,
      tag: "family-event-created",
      url: "/",
    });
    invalidateHomeFamilyCacheForFamily(auth.familyId);
    revalidatePath("/");
    revalidatePath("/calendar");

    return responseForSuccess(logScope, { event: created }, 201, auth);
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

export async function PATCH(request: NextRequest) {
  const logScope = startApiLog("/api/events", "PATCH");
  const auth = await resolveFamilyAuthOrResponse(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const body = await request.json();
  if (typeof body.id !== "string" || body.id.trim().length === 0) {
    return responseForFailure(logScope, 400, "id is required.", "VALIDATION", auth);
  }

  try {
    const updated = await updateFamilyEventInSupabase(auth, {
      id: body.id,
      title: typeof body.title === "string" ? body.title : undefined,
      startTime: typeof body.startTime === "string" ? body.startTime : undefined,
      endTime: typeof body.endTime === "string" ? body.endTime : undefined,
      isRoutine: typeof body.isRoutine === "boolean" ? body.isRoutine : undefined,
    });
    await dispatchFamilyPush(logScope, auth, {
      title: "가족 일정 수정",
      body: updated.title,
      tag: "family-event-updated",
      url: "/",
    });
    invalidateHomeFamilyCacheForFamily(auth.familyId);
    revalidatePath("/");
    revalidatePath("/calendar");

    return responseForSuccess(logScope, { event: updated }, 200, auth);
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

    const message = error instanceof Error ? error.message : "Invalid payload.";
    const status = message === "Event not found." ? 404 : 400;
    return responseForFailure(logScope, status, message, "VALIDATION", auth);
  }
}

export async function DELETE(request: NextRequest) {
  const logScope = startApiLog("/api/events", "DELETE");
  const auth = await resolveFamilyAuthOrResponse(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return responseForFailure(logScope, 400, "id is required.", "VALIDATION", auth);
  }

  try {
    const removed = await removeFamilyEventInSupabase(auth, id);
    if (!removed) {
      return responseForFailure(logScope, 404, "Not found.", "NOT_FOUND", auth);
    }
    await dispatchFamilyPush(logScope, auth, {
      title: "가족 일정 삭제",
      body: "일정 1건이 삭제되었습니다.",
      tag: "family-event-deleted",
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
