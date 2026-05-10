import { readAccessTokenClaims } from "@/modules/auth/access-token-claims";
import { readAuthUserMetadata } from "@/modules/auth/api/auth-user-metadata";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";

export async function readAnnualLeaveMetadataForHome(
  userId: string,
  accessToken: string,
): Promise<Record<string, unknown>> {
  const config = resolveSupabaseAdminAuthConfig();
  if (config) {
    try {
      return await readAuthUserMetadata(config, userId);
    } catch {
      // The home dashboard can still render from JWT metadata if Admin API is unavailable.
    }
  }

  const claims = readAccessTokenClaims(accessToken);
  return claims?.userId === userId ? claims.userMetadata ?? {} : {};
}
