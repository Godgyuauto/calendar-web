import { NextRequest } from "next/server";
import {
  parseSupabaseAuthError,
  resolveSupabaseAdminAuthConfig,
} from "@/modules/auth/api/supabase-auth";
import {
  readAuthUserMetadata,
  updateAuthUserMetadata,
} from "@/modules/auth/api/auth-user-metadata";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/_common/route-auth";
import {
  responseForFailure,
  responseForSuccess,
  startApiLog,
} from "@/modules/family/api/_common";
import { invalidateSettingsPageCacheForUser } from "@/modules/settings/settings-page-cache";
import { toAnnualLeaveMetadata } from "@/modules/leave/annual-leave-settings";
import { validateAnnualLeaveSettingsForm } from "@/modules/leave/annual-leave-settings-validation";

export async function PATCH(request: NextRequest) {
  const logScope = startApiLog(
    "/api/leave/settings",
    "PATCH",
    "pnpm run verify:release:auth",
  );
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION", auth);
  }

  const parsed = validateAnnualLeaveSettingsForm(body);
  if (!parsed.ok) {
    return responseForFailure(logScope, 400, parsed.message, "VALIDATION", auth);
  }

  let currentMetadata: Record<string, unknown>;
  try {
    currentMetadata = await readAuthUserMetadata(config, auth.userId);
  } catch {
    return responseForFailure(
      logScope,
      503,
      "연차 설정 정보를 읽지 못했습니다.",
      "AUTH_UPSTREAM",
      auth,
    );
  }

  const nextMetadata = {
    ...currentMetadata,
    ...toAnnualLeaveMetadata(parsed.data),
  };
  const upstreamResponse = await updateAuthUserMetadata(config, auth.userId, nextMetadata);
  if (!upstreamResponse.ok) {
    const upstreamBody = await upstreamResponse.json().catch(() => ({}));
    return responseForFailure(
      logScope,
      upstreamResponse.status,
      parseSupabaseAuthError(upstreamBody, "연차 설정 저장에 실패했습니다."),
      "AUTH_REJECT",
      auth,
    );
  }

  invalidateSettingsPageCacheForUser(auth.familyId, auth.userId);
  return responseForSuccess(logScope, { settings: parsed.data }, 200, auth);
}
