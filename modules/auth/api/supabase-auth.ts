export interface SupabaseAuthConfig {
  url: string;
  anonKey: string;
}

export interface SupabaseAdminAuthConfig extends SupabaseAuthConfig {
  serviceRoleKey: string;
}

export interface SupabaseTokenResponse {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error_description?: string;
  msg?: string;
}

export function resolveSupabaseAuthConfig(): SupabaseAuthConfig | null {
  const url =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    return null;
  }

  return { url: url.replace(/\/+$/, ""), anonKey };
}

export function resolveSupabaseAdminAuthConfig(): SupabaseAdminAuthConfig | null {
  const config = resolveSupabaseAuthConfig();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!config || !serviceRoleKey) {
    return null;
  }

  return { ...config, serviceRoleKey };
}

export function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function parseSupabaseAuthError(
  responseBody: unknown,
  fallbackMessage = "로그인에 실패했습니다.",
): string {
  if (!responseBody || typeof responseBody !== "object") {
    return fallbackMessage;
  }

  const payload = responseBody as SupabaseTokenResponse;
  return payload.error_description ?? payload.msg ?? fallbackMessage;
}
