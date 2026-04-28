import type { FamilyAuthContext } from "../_common/auth-context";
import { readAccessTokenClaims } from "@/modules/auth/access-token-claims";

export interface AuthProfileReadModel {
  email: string | null;
  displayName: string | null;
}

function pickString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseDisplayName(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") {
    return null;
  }

  const userMetadata = metadata as Record<string, unknown>;
  return (
    pickString(userMetadata.name) ??
    pickString(userMetadata.full_name) ??
    pickString(userMetadata.nickname) ??
    pickString(userMetadata.preferred_username)
  );
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
