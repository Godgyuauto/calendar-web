import { NextRequest } from "next/server";
import {
  isAccessTokenExpired,
  readAccessTokenClaims,
} from "@/modules/auth/access-token-claims";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { startApiLog } from "@/modules/family/api/_common";
import { responseForFailure, responseForSuccess } from "@/modules/family/api/_common";
import { DEFAULT_SHIFT_PATTERN_V1 } from "@/modules/shift";
import { validateFamilyName } from "@/modules/onboarding/family-name-validation";

interface CreateFamilyBody {
  familyName?: unknown;
}

interface FamilyRow {
  id?: string;
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

async function insertFamily(url: string, headers: HeadersInit, familyName: string): Promise<string> {
  const response = await fetch(`${url}/rest/v1/families`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: familyName }),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to create family.");
  }
  const rows = (await response.json().catch(() => [])) as FamilyRow[];
  const familyId = rows[0]?.id;
  if (!familyId) {
    throw new Error("Family response is missing id.");
  }
  return familyId;
}

async function insertFamilySetup(url: string, headers: HeadersInit, familyId: string, userId: string) {
  const memberResponse = await fetch(`${url}/rest/v1/family_members`, {
    method: "POST",
    headers,
    body: JSON.stringify({ family_id: familyId, user_id: userId, role: "admin" }),
    cache: "no-store",
  });
  if (!memberResponse.ok) {
    throw new Error("Failed to create family membership.");
  }

  const patternResponse = await fetch(`${url}/rest/v1/shift_patterns`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      family_id: familyId,
      pattern_id: DEFAULT_SHIFT_PATTERN_V1.patternId,
      version: DEFAULT_SHIFT_PATTERN_V1.version,
      seed_date: DEFAULT_SHIFT_PATTERN_V1.seedDate,
      shift_cycle: DEFAULT_SHIFT_PATTERN_V1.shiftCycle,
      is_active: true,
      created_by: userId,
    }),
    cache: "no-store",
  });
  if (!patternResponse.ok) {
    throw new Error("Failed to create default shift pattern.");
  }
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/onboarding/family", "POST", "pnpm run verify:release:auth");
  const config = resolveSupabaseAdminAuthConfig();
  const headers = getServiceHeaders("return=representation");
  if (!config || !headers) {
    return responseForFailure(logScope, 503, "Supabase admin configuration is missing.", "CONFIG");
  }

  const accessToken = await getServerAccessTokenFromCookies(request.headers.get("cookie"));
  const claims = accessToken ? readAccessTokenClaims(accessToken) : null;
  if (!accessToken || !claims?.userId || isAccessTokenExpired(accessToken)) {
    return responseForFailure(logScope, 401, "로그인이 필요합니다.", "AUTH");
  }

  let body: CreateFamilyBody;
  try {
    body = (await request.json()) as CreateFamilyBody;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION");
  }

  const familyName = validateFamilyName(body.familyName);
  if (!familyName.ok) {
    return responseForFailure(logScope, 400, familyName.message, "VALIDATION", {
      userId: claims.userId,
    });
  }

  try {
    if (await userHasFamily(config.url, headers, claims.userId)) {
      return responseForFailure(logScope, 409, "이미 연결된 가족 캘린더가 있습니다.", "CONFLICT", {
        userId: claims.userId,
      });
    }

    const familyId = await insertFamily(config.url, headers, familyName.familyName);
    await insertFamilySetup(config.url, headers, familyId, claims.userId);
    return responseForSuccess(logScope, { ok: true, familyId }, 201, {
      familyId,
      userId: claims.userId,
    });
  } catch {
    return responseForFailure(logScope, 503, "가족 캘린더를 만들지 못했습니다.", "UPSTREAM", {
      userId: claims.userId,
    });
  }
}
