import "server-only";

interface AccessTokenClaimsPayload {
  sub?: unknown;
  email?: unknown;
  exp?: unknown;
  user_metadata?: unknown;
}

export interface AccessTokenClaims {
  userId: string | null;
  email: string | null;
  expiresAtEpochSec: number | null;
  userMetadata: Record<string, unknown> | null;
}

function decodeBase64Url(value: string): string | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const normalized = `${padded}${"=".repeat((4 - (padded.length % 4)) % 4)}`;
    return Buffer.from(normalized, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

function pickTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function readAccessTokenClaims(accessToken: string): AccessTokenClaims | null {
  const payload = accessToken.split(".")[1];
  if (!payload) {
    return null;
  }

  const decoded = decodeBase64Url(payload);
  if (!decoded) {
    return null;
  }

  try {
    const parsed = JSON.parse(decoded) as AccessTokenClaimsPayload;
    const exp = Number(parsed.exp);
    return {
      userId: pickTrimmedString(parsed.sub),
      email: pickTrimmedString(parsed.email),
      expiresAtEpochSec: Number.isFinite(exp) ? exp : null,
      userMetadata:
        parsed.user_metadata && typeof parsed.user_metadata === "object"
          ? (parsed.user_metadata as Record<string, unknown>)
          : null,
    };
  } catch {
    return null;
  }
}

export function isAccessTokenExpired(
  accessToken: string,
  nowEpochSec: number = Math.floor(Date.now() / 1000),
): boolean {
  const claims = readAccessTokenClaims(accessToken);
  if (!claims) {
    return true;
  }

  if (claims.expiresAtEpochSec === null) {
    return false;
  }

  return claims.expiresAtEpochSec <= nowEpochSec;
}
