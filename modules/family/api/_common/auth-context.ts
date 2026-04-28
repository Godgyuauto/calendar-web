import { NextRequest } from "next/server";
import {
  isAccessTokenExpired,
  readAccessTokenClaims,
} from "@/modules/auth/access-token-claims";
import {
  readCachedAuthContext,
  writeCachedAuthContext,
} from "./auth-context-cache";
import {
  getBearerToken,
  getOptionalFamilyIdHeader,
  normalizeAccessToken,
} from "./auth-context-request";
import {
  fetchFamilyMembership,
  getSupabaseAuthConfig,
} from "./auth-context-membership";
import {
  ApiAuthError,
  type ApiAuthFailure,
  type FamilyAuthContext,
} from "./auth-context-types";

export type { ApiAuthFailure, FamilyAuthContext } from "./auth-context-types";

function resolveUserIdFromAccessToken(accessToken: string): string {
  const claims = readAccessTokenClaims(accessToken);
  if (!claims?.userId) {
    throw new ApiAuthError("Invalid or expired access token.", 401);
  }
  if (isAccessTokenExpired(accessToken)) {
    throw new ApiAuthError("Invalid or expired access token.", 401);
  }
  return claims.userId;
}

export async function resolveFamilyAuthContext(request: NextRequest): Promise<FamilyAuthContext> {
  const accessToken = getBearerToken(request);
  const requestedFamilyId = getOptionalFamilyIdHeader(request);
  return resolveFamilyAuthContextFromToken(accessToken, requestedFamilyId);
}

export async function resolveFamilyAuthContextFromToken(
  accessToken: string,
  requestedFamilyId?: string,
): Promise<FamilyAuthContext> {
  const normalizedToken = normalizeAccessToken(accessToken);
  const nowMs = Date.now();
  const cacheKey = `${requestedFamilyId ?? "-"}::${normalizedToken}`;
  const cached = readCachedAuthContext(cacheKey, nowMs);
  if (cached) {
    return cached;
  }

  const userId = resolveUserIdFromAccessToken(normalizedToken);
  const config = getSupabaseAuthConfig();
  const membership = await fetchFamilyMembership(
    config,
    normalizedToken,
    userId,
    requestedFamilyId,
  );
  if (!membership) {
    throw new ApiAuthError("Family membership is required.", 403);
  }

  const resolved: FamilyAuthContext = {
    familyId: membership.family_id,
    userId,
    accessToken: normalizedToken,
  };
  const claims = readAccessTokenClaims(normalizedToken);
  writeCachedAuthContext(cacheKey, resolved, nowMs, claims?.expiresAtEpochSec ?? null);
  return resolved;
}

export function getApiAuthFailure(error: unknown): ApiAuthFailure | null {
  if (error instanceof ApiAuthError) {
    return { message: error.message, status: error.status };
  }
  return null;
}
