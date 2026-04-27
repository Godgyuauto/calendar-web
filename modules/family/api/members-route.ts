import { NextRequest, NextResponse } from "next/server";
import {
  getFamilyMembersWorkingRepositoryFailure,
  updateOwnWorkingFromSupabase,
} from "@/modules/family/api/family-members-working-repository";
import { listFamilyMembersFromSupabase } from "@/modules/family/api/family-members-settings-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import { startApiLog } from "@/modules/family/api/request-log";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/route-auth";
import {
  logUnexpectedFailure,
  responseForAuthFailure,
  responseForFailure,
  responseForNoContent,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";

export async function GET(request: NextRequest) {
  const logScope = startApiLog("/api/members", "GET");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  try {
    const members = await listFamilyMembersFromSupabase(auth);
    return responseForSuccess(logScope, { members }, 200, auth);
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

interface UpdateOwnWorkingBody {
  working?: unknown;
}

function parseWorking(value: unknown): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  return null;
}

export async function PATCH(request: NextRequest) {
  const logScope = startApiLog("/api/members", "PATCH", "pnpm run verify:release:auth");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  let body: UpdateOwnWorkingBody;
  try {
    body = (await request.json()) as UpdateOwnWorkingBody;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION", auth);
  }

  const working = parseWorking(body.working);
  if (working === null) {
    return responseForFailure(
      logScope,
      400,
      "working(boolean) is required.",
      "VALIDATION",
      auth,
    );
  }

  try {
    await updateOwnWorkingFromSupabase(auth, working);
    return responseForNoContent(logScope, 204, auth);
  } catch (error) {
    const failure =
      getFamilyMembersWorkingRepositoryFailure(error) ??
      getFamilyRepositoryFailure(error);
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
