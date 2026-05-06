import type { FamilyAuthContext } from "../_common/auth-context";
import { readAccessTokenClaims } from "@/modules/auth/access-token-claims";
import { parseDisplayName } from "./auth-profile-metadata";

export interface AuthProfileReadModel {
  email: string | null;
  displayName: string | null;
}

export async function readAuthProfileFromSupabase(
  auth: FamilyAuthContext,
): Promise<AuthProfileReadModel> {
  const payload = readAccessTokenClaims(auth.accessToken);
  return {
    email: payload?.email ?? null,
    displayName: parseDisplayName(payload?.userMetadata),
  };
}
