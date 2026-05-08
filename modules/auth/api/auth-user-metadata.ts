import type { SupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";

interface AdminUserResponse {
  user_metadata?: Record<string, unknown> | null;
}

export async function readAuthUserMetadata(
  config: SupabaseAdminAuthConfig,
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

export async function updateAuthUserMetadata(
  config: SupabaseAdminAuthConfig,
  userId: string,
  userMetadata: Record<string, unknown>,
): Promise<Response> {
  return fetch(`${config.url}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ user_metadata: userMetadata }),
    cache: "no-store",
  });
}
