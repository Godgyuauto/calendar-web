import { NextRequest, NextResponse } from "next/server";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";
import {
  responseForAuthFailure,
  responseForFailure,
  responseForSuccess,
  resolveFamilyAuthOrResponseWithCookie,
  startApiLog,
} from "@/modules/family/api/_common";
import { listFamilyMembersFromSupabase } from "@/modules/family/api/members";
import { createFamilyInviteCode } from "@/modules/onboarding/invite-code";

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/invites", "POST", "pnpm run verify:release:auth");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const config = resolveSupabaseAdminAuthConfig();
  if (!config) {
    return responseForFailure(logScope, 503, "Supabase admin configuration is missing.", "CONFIG", {
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }

  try {
    const members = await listFamilyMembersFromSupabase(auth);
    const self = members.find((member) => member.userId === auth.userId);
    if (self?.role !== "admin") {
      return responseForFailure(logScope, 403, "가족 관리자만 초대 코드를 만들 수 있습니다.", "AUTH", {
        familyId: auth.familyId,
        userId: auth.userId,
      });
    }

    const inviteCode = createFamilyInviteCode(auth.familyId, config.serviceRoleKey);
    return responseForSuccess(logScope, { inviteCode }, 201, {
      familyId: auth.familyId,
      userId: auth.userId,
    });
  } catch {
    return responseForFailure(logScope, 503, "초대 코드를 만들지 못했습니다.", "UPSTREAM", {
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}
