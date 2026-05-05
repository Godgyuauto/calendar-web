import { NextRequest } from "next/server";
import { startApiLog } from "@/modules/family/api/_common";
import { responseForFailure, responseForSuccess } from "@/modules/family/api/_common";
import { setAccessTokenCookie, setRefreshTokenCookie } from "@/modules/auth/api/auth-cookie";
import {
  asNonEmptyString,
  parseSupabaseAuthError,
  resolveSupabaseAdminAuthConfig,
  type SupabaseAdminAuthConfig,
  type SupabaseTokenResponse,
} from "@/modules/auth/api/supabase-auth";
import {
  isDuplicateAccountMessage,
  validateSignupForm,
} from "@/modules/auth/api/signup-validation";

interface SignupRequestBody {
  email?: unknown;
  password?: unknown;
  displayName?: unknown;
}

interface AdminUserRow {
  email?: string | null;
}

interface AdminUsersResponse {
  users?: AdminUserRow[];
}

async function emailAlreadyExists(
  config: SupabaseAdminAuthConfig,
  email: string,
): Promise<boolean> {
  const query = new URLSearchParams({
    page: "1",
    per_page: "20",
    filter: email,
  });
  const response = await fetch(`${config.url}/auth/v1/admin/users?${query.toString()}`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to check existing auth users.");
  }

  const body = (await response.json().catch(() => ({}))) as AdminUsersResponse;
  return (body.users ?? []).some((user) => user.email?.toLowerCase() === email);
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/auth/signup", "POST", "pnpm run verify:release:auth");
  const config = resolveSupabaseAdminAuthConfig();
  if (!config) {
    return responseForFailure(
      logScope,
      503,
      "Supabase auth admin configuration is missing.",
      "AUTH_CONFIG",
    );
  }

  let body: SignupRequestBody;
  try {
    body = (await request.json()) as SignupRequestBody;
  } catch {
    return responseForFailure(logScope, 400, "Invalid JSON body.", "VALIDATION");
  }

  const parsed = validateSignupForm(body);
  if (!parsed.ok) {
    return responseForFailure(logScope, 400, parsed.message, "VALIDATION");
  }

  const { email, password, displayName } = parsed.data;
  try {
    if (await emailAlreadyExists(config, email)) {
      return responseForFailure(logScope, 409, "이미 가입된 이메일입니다.", "AUTH_DUPLICATE");
    }
  } catch {
    return responseForFailure(
      logScope,
      503,
      "가입 전 계정 중복 확인에 실패했습니다.",
      "AUTH_UPSTREAM",
    );
  }

  let upstreamResponse: Response;
  try {
    upstreamResponse = await fetch(`${config.url}/auth/v1/signup`, {
      method: "POST",
      headers: {
        apikey: config.anonKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        data: { display_name: displayName },
      }),
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
    const message = parseSupabaseAuthError(upstreamBody, "가입에 실패했습니다.");
    const safeMessage = isDuplicateAccountMessage(message)
      ? "이미 가입된 이메일입니다."
      : message;
    return responseForFailure(
      logScope,
      isDuplicateAccountMessage(message) ? 409 : upstreamResponse.status,
      safeMessage,
      "AUTH_REJECT",
    );
  }

  const accessToken = asNonEmptyString(upstreamBody.access_token);
  const response = responseForSuccess(logScope, { ok: true, signedIn: Boolean(accessToken) }, 201);
  if (accessToken) {
    setAccessTokenCookie(response, accessToken, upstreamBody.expires_in);
  }
  const refreshToken = asNonEmptyString(upstreamBody.refresh_token);
  if (refreshToken) {
    setRefreshTokenCookie(response, refreshToken);
  }
  return response;
}
