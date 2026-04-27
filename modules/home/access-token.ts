import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE_NAMES = [
  "access_token",
  "sb-access-token",
  "supabase-access-token",
] as const;

function looksLikeJwt(value: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(value);
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

function extractTokenFromJson(value: string): string | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (typeof parsed === "string" && looksLikeJwt(parsed)) {
      return parsed;
    }

    if (Array.isArray(parsed)) {
      const first = parsed[0];
      return typeof first === "string" && looksLikeJwt(first) ? first : null;
    }

    if (parsed && typeof parsed === "object") {
      const record = parsed as { access_token?: unknown; currentSession?: unknown };
      if (typeof record.access_token === "string" && looksLikeJwt(record.access_token)) {
        return record.access_token;
      }

      if (
        record.currentSession &&
        typeof record.currentSession === "object" &&
        typeof (record.currentSession as { access_token?: unknown }).access_token === "string"
      ) {
        const nested = (record.currentSession as { access_token: string }).access_token;
        return looksLikeJwt(nested) ? nested : null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

function decodeCookieValue(rawValue: string): string {
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function extractAccessToken(rawValue: string): string | null {
  const decoded = decodeCookieValue(rawValue).trim();
  if (looksLikeJwt(decoded)) {
    return decoded;
  }

  if (decoded.toLowerCase().startsWith("bearer ")) {
    const bearer = decoded.slice(7).trim();
    return looksLikeJwt(bearer) ? bearer : null;
  }

  if (decoded.startsWith("base64-")) {
    const unpacked = decodeBase64Url(decoded.slice(7));
    if (unpacked) {
      const token = extractTokenFromJson(unpacked);
      if (token) {
        return token;
      }
      if (looksLikeJwt(unpacked.trim())) {
        return unpacked.trim();
      }
    }
  }

  return extractTokenFromJson(decoded);
}

type CookieCandidate = { name: string; value: string };

function parseCookieHeader(cookieHeader: string): CookieCandidate[] {
  return cookieHeader
    .split(";")
    .map((entry) => entry.trim())
    .map((entry) => {
      const separator = entry.indexOf("=");
      if (separator <= 0) {
        return null;
      }
      return {
        name: entry.slice(0, separator).trim(),
        value: entry.slice(separator + 1),
      };
    })
    .filter((entry): entry is CookieCandidate => entry !== null);
}

function resolveTokenFromCandidates(candidates: CookieCandidate[]): string | null {
  for (const name of ACCESS_TOKEN_COOKIE_NAMES) {
    const direct = candidates.find((candidate) => candidate.name === name)?.value;
    if (!direct) {
      continue;
    }

    const token = extractAccessToken(direct);
    if (token) {
      return token;
    }
  }

  for (const candidate of candidates) {
    if (!/auth-token|access-token/i.test(candidate.name)) {
      continue;
    }

    const token = extractAccessToken(candidate.value);
    if (token) {
      return token;
    }
  }

  return null;
}

export async function getServerAccessTokenFromCookies(
  cookieHeader?: string | null,
): Promise<string | null> {
  if (typeof cookieHeader === "string") {
    return resolveTokenFromCandidates(parseCookieHeader(cookieHeader));
  }

  const cookieStore = await cookies();
  const candidates = cookieStore
    .getAll()
    .map((cookie) => ({ name: cookie.name, value: cookie.value }));
  return resolveTokenFromCandidates(candidates);
}
