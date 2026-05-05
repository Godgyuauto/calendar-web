import { NextRequest } from "next/server";
import {
  isAccessTokenExpired,
  readAccessTokenClaims,
} from "@/modules/auth/access-token-claims";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";
import { responseForFailure, responseForSuccess, startApiLog } from "@/modules/family/api/_common";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { verifyFamilyInviteCode } from "@/modules/onboarding/invite-code";

interface JoinInviteBody {
  inviteCode?: unknown;
}

function getServiceHeaders(prefer?: string): HeadersInit | null {
  const config = resolveSupabaseAdminAuthConfig();
  if (!config) {
    return null;
  }

  return {
    apikey: config.serviceRoleKey,
    Authorization: `Bearer ${config.serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function userHasFamily(url: string, headers: HeadersInit, userId: string): Promise<boolean> {
  const query = new URLSearchParams({
    select: "family_id",
    user_id: `eq.${userId}`,
    limit: "1",
  });
  const response = await fetch(`${url}/rest/v1/family_members?${query.toString()}`, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to check family membership.");
  }
  const rows = (await response.json().catch(() => [])) as unknown[];
  return Array.isArray(rows) && rows.length > 0;
}

async function insertFamilyMember(
  url: string,
  headers: HeadersInit,
  familyId: string,
  userId: string,
) {
  const response = await fetch(`${url}/rest/v1/family_members`, {
    method: "POST",
    headers,
    body: JSON.stringify({ family_id: familyId, user_id: userId, role: "editor" }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to join family.");
  }
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/onboarding/invite", "POST", "pnpm run verify:release:auth");
  const config = resolveSupabaseAdminAuthConfig();
  const headers = getServiceHeaders();
  if (!config || !headers) {
    return responseForFailure(logScope, 503, "Supabase admin configuration is missing.", "CONFIG");
  }

  const accessToken = await getServerAccessTokenFromCookies(request.headers.get("cookie"));
  const claims = accessToken ? readAccessTokenClaims(accessToken) : null;
  if (!accessToken || !claims?.userId || isAccessTokenExpired(accessToken)) {
    return responseForFailure(logScope, 401, "로그인이 필요합니다.", "AUTH");
  }

  let body: JoinInviteBody;
  try {
    body = (await request.json()) as JoinInviteBody;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION", {
      userId: claims.userId,
    });
  }

  const invite = verifyFamilyInviteCode(body.inviteCode, config.serviceRoleKey);
  if (!invite.ok) {
    return responseForFailure(logScope, 400, invite.message, "VALIDATION", {
      userId: claims.userId,
    });
  }

  try {
    if (await userHasFamily(config.url, headers, claims.userId)) {
      return responseForFailure(logScope, 409, "이미 연결된 가족 캘린더가 있습니다.", "CONFLICT", {
        familyId: invite.familyId,
        userId: claims.userId,
      });
    }

    await insertFamilyMember(config.url, headers, invite.familyId, claims.userId);
    return responseForSuccess(logScope, { ok: true, familyId: invite.familyId }, 201, {
      familyId: invite.familyId,
      userId: claims.userId,
    });
  } catch {
    return responseForFailure(logScope, 503, "가족 캘린더에 참여하지 못했습니다.", "UPSTREAM", {
      familyId: invite.familyId,
      userId: claims.userId,
    });
  }
}
