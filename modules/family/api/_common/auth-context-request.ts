import { NextRequest } from "next/server";
import { ApiAuthError } from "./auth-context-types";

const AUTHORIZATION_HEADER = "authorization";
const FAMILY_ID_HEADER = "x-family-id";

export function getBearerToken(request: NextRequest): string {
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

export function getOptionalFamilyIdHeader(request: NextRequest): string | undefined {
  const familyId = request.headers.get(FAMILY_ID_HEADER)?.trim();
  if (!familyId) {
    return undefined;
  }

  return familyId;
}

export function normalizeAccessToken(accessToken: string): string {
  const token = accessToken.trim();
  if (token.length === 0) {
    throw new ApiAuthError("Authorization header must use Bearer token.", 401);
  }

  return token;
}
