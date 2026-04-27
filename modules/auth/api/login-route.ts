import { NextRequest } from "next/server";
import { startApiLog } from "@/modules/family/api/request-log";
import { responseForFailure, responseForNoContent } from "@/modules/family/api/route-log-response";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/modules/auth/api/auth-cookie";
import {
  asNonEmptyString,
  parseSupabaseAuthError,
  resolveSupabaseAuthConfig,
  type SupabaseTokenResponse,
} from "@/modules/auth/api/supabase-auth";

interface LoginRequestBody {
  email?: unknown;
  password?: unknown;
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/auth/login", "POST", "pnpm run verify:release:auth");
  const config = resolveSupabaseAuthConfig();
  if (!config) {
    return responseForFailure(
      logScope,
      503,
      "Supabase auth configuration is missing.",
      "AUTH_CONFIG",
    );
  }

  let body: LoginRequestBody;
  try {
    body = (await request.json()) as LoginRequestBody;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION");
  }

  const email = asNonEmptyString(body.email);
  const password = asNonEmptyString(body.password);
  if (!email || !password) {
    return responseForFailure(logScope, 400, "email and password are required.", "VALIDATION");
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${config.url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
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
    return responseForFailure(logScope, status, parseSupabaseAuthError(upstreamBody), "AUTH_REJECT");
  }

  const accessToken = asNonEmptyString(upstreamBody.access_token);
  if (!accessToken) {
    return responseForFailure(logScope, 503, "Auth response does not include access_token.", "AUTH_UPSTREAM");
  }

  const response = responseForNoContent(logScope, 204);
  // Why: keep token out of JS runtime and let server-only cookie become the
  // primary auth transport for browser->server requests.
  setAccessTokenCookie(response, accessToken, upstreamBody.expires_in);
  const refreshToken = asNonEmptyString(upstreamBody.refresh_token);
  if (refreshToken) {
    setRefreshTokenCookie(response, refreshToken);
  }
  return response;
}
