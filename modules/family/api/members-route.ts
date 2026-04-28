import { NextRequest, NextResponse } from "next/server";
import {
  getFamilyMembersRoleRepositoryFailure,
  updateFamilyMemberRoleFromSupabase,
} from "@/modules/family/api/family-members-role-repository";
import {
  getFamilyMembersWorkingRepositoryFailure,
  updateOwnWorkingFromSupabase,
} from "@/modules/family/api/family-members-working-repository";
import {
  pickFamilyMasterUserId,
  resolveFamilyAppRole,
} from "@/modules/family/api/family-member-role";
import { parseRoleUpdate } from "@/modules/family/api/members-role-update";
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
  targetUserId?: unknown;
  role?: unknown;
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

  const roleUpdate = parseRoleUpdate(body);
  if (roleUpdate) {
    try {
      const members = await listFamilyMembersFromSupabase(auth);
      const familyMasterUserId = pickFamilyMasterUserId(members);
      if (!familyMasterUserId) {
        return responseForFailure(
          logScope,
          409,
          "Family master is not configured.",
          "VALIDATION",
          auth,
        );
      }

      const selfMember = members.find((member) => member.userId === auth.userId);
      if (!selfMember) {
        return responseForFailure(
          logScope,
          403,
          "Family membership is required.",
          "AUTH",
          auth,
        );
      }

      const selfAppRole = resolveFamilyAppRole(selfMember, familyMasterUserId);
      if (selfAppRole !== "master") {
        return responseForFailure(
          logScope,
          403,
          "Only family master can change role.",
          "AUTH",
          auth,
        );
      }

      const targetMember = members.find(
        (member) => member.userId === roleUpdate.targetUserId,
      );
      if (!targetMember) {
        return responseForFailure(logScope, 404, "Target member not found.", "NOT_FOUND", auth);
      }

      if (targetMember.userId === familyMasterUserId && roleUpdate.role !== "admin") {
        return responseForFailure(
          logScope,
          400,
          "Family master role cannot be downgraded.",
          "VALIDATION",
          auth,
        );
      }

      await updateFamilyMemberRoleFromSupabase(auth, roleUpdate.targetUserId, roleUpdate.role);
      return responseForNoContent(logScope, 204, auth);
    } catch (error) {
      const failure =
        getFamilyMembersRoleRepositoryFailure(error) ??
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

  const working = parseWorking(body.working);
  if (working === null) {
    return responseForFailure(
      logScope,
      400,
      "working(boolean) or targetUserId+role is required.",
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
