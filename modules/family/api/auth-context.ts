import { NextRequest } from "next/server";
import {
  isAccessTokenExpired,
  readAccessTokenClaims,
} from "@/modules/auth/access-token-claims";
import {
  readCachedAuthContext,
  writeCachedAuthContext,
} from "@/modules/family/api/auth-context-cache";

const AUTHORIZATION_HEADER = "authorization";
const FAMILY_ID_HEADER = "x-family-id";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface FamilyMemberRow {
  family_id: string;
}

class ApiAuthError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export interface FamilyAuthContext {
  familyId: string;
  userId: string;
  accessToken: string;
}

export interface ApiAuthFailure {
  message: string;
  status: number;
}

function getSupabaseConfig(): SupabaseConfig {
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

function getBearerToken(request: NextRequest): string {
  const header = request.headers.get(AUTHORIZATION_HEADER);
  if (typeof header !== "string") {
    throw new ApiAuthError("Authorization header is required.", 401);
  }

  const [scheme, token] = header.trim().split(/\s+/, 2);
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    throw new ApiAuthError("Authorization header must use Bearer token.", 401);
  }

  return token;
}

function getOptionalFamilyIdHeader(request: NextRequest): string | undefined {
  const familyId = request.headers.get(FAMILY_ID_HEADER)?.trim();
  if (!familyId) {
    return undefined;
  }

  return familyId;
}

function normalizeAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (token.length === 0) {
    throw new ApiAuthError("Authorization header must use Bearer token.", 401);
  }

  return token;
}

async function fetchFamilyMembership(
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
  const config = getSupabaseConfig();
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
