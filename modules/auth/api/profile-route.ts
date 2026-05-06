import { NextRequest } from "next/server";
import { readAccessTokenClaims } from "@/modules/auth/access-token-claims";
import {
  parseSupabaseAuthError,
  resolveSupabaseAdminAuthConfig,
} from "@/modules/auth/api/supabase-auth";
import { validateProfileUpdateForm } from "@/modules/auth/api/profile-update-validation";
import { responseForFailure, responseForNoContent, startApiLog } from "@/modules/family/api/_common";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/_common/route-auth";
import { invalidateHomeFamilyCacheForFamily } from "@/modules/home/home-family-cache";
import { invalidateMembersPageCacheForUser } from "@/modules/members/members-page-cache";
import { invalidateSettingsPageCacheForUser } from "@/modules/settings/settings-page-cache";

interface AdminUserResponse {
  user_metadata?: Record<string, unknown> | null;
}

async function readCurrentUserMetadata(
  config: NonNullable<ReturnType<typeof resolveSupabaseAdminAuthConfig>>,
  userId: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Unable to read auth user.");
  }

  const body = (await response.json().catch(() => ({}))) as AdminUserResponse;
  return body.user_metadata && typeof body.user_metadata === "object"
    ? body.user_metadata
    : {};
}

export async function PATCH(request: NextRequest) {
  const logScope = startApiLog("/api/profile", "PATCH", "pnpm run verify:release:auth");
  const config = resolveSupabaseAdminAuthConfig();
  if (!config) {
    return responseForFailure(
      logScope,
      503,
      "Supabase auth admin configuration is missing.",
      "AUTH_CONFIG",
    );
  }

  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof Response) {
    return auth;
  }

  let body: { displayName?: unknown };
  try {
    body = (await request.json()) as { displayName?: unknown };
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION", auth);
  }

  const parsed = validateProfileUpdateForm(body);
  if (!parsed.ok) {
    return responseForFailure(logScope, 400, parsed.message, "VALIDATION", auth);
  }

  let currentMetadata: Record<string, unknown>;
  try {
    currentMetadata = await readCurrentUserMetadata(config, auth.userId);
  } catch {
    return responseForFailure(
      logScope,
      503,
      "프로필 정보를 읽지 못했습니다.",
      "AUTH_UPSTREAM",
      auth,
    );
  }

  const claims = readAccessTokenClaims(auth.accessToken);
  const nextMetadata = {
    ...currentMetadata,
    display_name: parsed.data.displayName,
    name: parsed.data.displayName,
    email: claims?.email ?? currentMetadata.email,
  };

  const upstreamResponse = await fetch(`${config.url}/auth/v1/admin/users/${auth.userId}`, {
    method: "PUT",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_metadata: nextMetadata }),
    cache: "no-store",
  });

  if (!upstreamResponse.ok) {
    const upstreamBody = await upstreamResponse.json().catch(() => ({}));
    return responseForFailure(
      logScope,
      upstreamResponse.status,
      parseSupabaseAuthError(upstreamBody, "프로필 저장에 실패했습니다."),
      "AUTH_REJECT",
      auth,
    );
  }

  invalidateHomeFamilyCacheForFamily(auth.familyId);
  invalidateMembersPageCacheForUser(auth.familyId, auth.userId);
  invalidateSettingsPageCacheForUser(auth.familyId, auth.userId);
  return responseForNoContent(logScope, 204, auth);
}
