import { NextRequest } from "next/server";
import { startApiLog } from "@/modules/family/api/_common";
import { responseForFailure, responseForNoContent } from "@/modules/family/api/_common";
import {
  clearAccessTokenCookies,
  REFRESH_TOKEN_COOKIE_NAMES,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from "@/modules/auth/api/auth-cookie";
import {
  asNonEmptyString,
  parseSupabaseAuthError,
  resolveSupabaseAuthConfig,
  type SupabaseTokenResponse,
} from "@/modules/auth/api/supabase-auth";

function readRefreshTokenFromRequest(request: NextRequest): string | null {
  for (const cookieName of REFRESH_TOKEN_COOKIE_NAMES) {
    const raw = request.cookies.get(cookieName)?.value;
    const token = asNonEmptyString(raw);
    if (token) {
      return token;
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/auth/refresh", "POST", "pnpm run verify:release:auth");
  const config = resolveSupabaseAuthConfig();
  if (!config) {
    return responseForFailure(
      logScope,
      503,
      "Supabase auth configuration is missing.",
      "AUTH_CONFIG",
    );
  }

  const refreshToken = readRefreshTokenFromRequest(request);
  if (!refreshToken) {
    // No logged-in session cookie means there is nothing to refresh.
    return responseForNoContent(logScope, 204);
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${config.url}/auth/v1/token?grant_type=refresh_token`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
  } catch {
    return responseForFailure(
      logScope,
      503,
      "Unable to reach Supabase Auth server.",
      "AUTH_UPSTREAM",
    );
  }

  const upstreamBody = (await upstreamResponse.json().catch(() => ({}))) as SupabaseTokenResponse;
  if (!upstreamResponse.ok) {
    const status = upstreamResponse.status === 400 ? 401 : upstreamResponse.status;
    const response = responseForFailure(
      logScope,
      status,
      parseSupabaseAuthError(upstreamBody, "세션 갱신에 실패했습니다."),
      "AUTH_REJECT",
    );
    clearAccessTokenCookies(response);
    return response;
  }

  const nextAccessToken = asNonEmptyString(upstreamBody.access_token);
  if (!nextAccessToken) {
    return responseForFailure(
      logScope,
      503,
      "Auth response does not include access_token.",
      "AUTH_UPSTREAM",
    );
  }

  const response = responseForNoContent(logScope, 204);
  setAccessTokenCookie(response, nextAccessToken, upstreamBody.expires_in);
  const nextRefreshToken = asNonEmptyString(upstreamBody.refresh_token);
  if (nextRefreshToken) {
    setRefreshTokenCookie(response, nextRefreshToken);
  }
  return response;
}
