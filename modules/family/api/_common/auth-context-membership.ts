import {
  ApiAuthError,
  type FamilyMemberRow,
  type SupabaseConfig,
} from "./auth-context-types";

export function getSupabaseAuthConfig(): SupabaseConfig {
  const url =
    process.env.SUPABASE_URL?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new ApiAuthError(
      "Server auth is not configured. Set SUPABASE_URL/SUPABASE_ANON_KEY (or NEXT_PUBLIC equivalents).",
      503,
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    anonKey,
  };
}

export async function fetchFamilyMembership(
  config: SupabaseConfig,
  accessToken: string,
  userId: string,
  requestedFamilyId?: string,
): Promise<FamilyMemberRow | null> {
  const query = new URLSearchParams({
    select: "family_id",
    user_id: `eq.${userId}`,
    limit: "1",
  });
  if (requestedFamilyId) {
    query.set("family_id", `eq.${requestedFamilyId}`);
  } else {
    query.set("order", "created_at.asc");
  }

  let response: Response;
  try {
    response = await fetch(`${config.url}/rest/v1/family_members?${query.toString()}`, {
      method: "GET",
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new ApiAuthError("Unable to reach Supabase data API.", 503);
  }

  if (response.status === 401) {
    throw new ApiAuthError("Invalid or expired access token.", 401);
  }

  if (response.status === 403) {
    throw new ApiAuthError("Family membership is required.", 403);
  }

  if (!response.ok) {
    throw new ApiAuthError("Failed to resolve family membership.", 503);
  }

  const rows = (await response.json()) as FamilyMemberRow[];
  const memberships = Array.isArray(rows) ? rows : [];
  return memberships[0] ?? null;
}
