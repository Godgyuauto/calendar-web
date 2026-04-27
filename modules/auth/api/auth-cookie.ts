import { NextResponse } from "next/server";
import { ACCESS_TOKEN_COOKIE_NAMES } from "@/modules/home/access-token";

const DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS = 60 * 60;
const DEFAULT_REFRESH_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const REFRESH_TOKEN_COOKIE_NAMES = [
  "refresh_token",
  "sb-refresh-token",
  "supabase-refresh-token",
] as const;

function isSecureCookieEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}

function normalizeMaxAge(expiresIn: unknown): number {
  if (!Number.isFinite(expiresIn)) {
    return DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS;
  }

  const seconds = Math.floor(Number(expiresIn));
  if (seconds <= 0) {
    return DEFAULT_ACCESS_TOKEN_MAX_AGE_SECONDS;
  }

  return seconds;
}

export function setAccessTokenCookie(
  response: NextResponse,
  accessToken: string,
  expiresIn?: unknown,
): void {
  response.cookies.set({
    name: "access_token",
    value: accessToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookieEnabled(),
    path: "/",
    maxAge: normalizeMaxAge(expiresIn),
  });
}

function resolveRefreshTokenMaxAge(): number {
  const configured = Number(process.env.AUTH_REFRESH_TOKEN_MAX_AGE_SECONDS ?? "");
  if (!Number.isFinite(configured)) {
    return DEFAULT_REFRESH_TOKEN_MAX_AGE_SECONDS;
  }

  const seconds = Math.floor(configured);
  if (seconds <= 0) {
    return DEFAULT_REFRESH_TOKEN_MAX_AGE_SECONDS;
  }

  return seconds;
}

export function setRefreshTokenCookie(
  response: NextResponse,
  refreshToken: string,
): void {
  response.cookies.set({
    name: "refresh_token",
    value: refreshToken,
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookieEnabled(),
    path: "/",
    maxAge: resolveRefreshTokenMaxAge(),
  });
}

export function clearAccessTokenCookies(response: NextResponse): void {
  const cookieNames = [...ACCESS_TOKEN_COOKIE_NAMES, ...REFRESH_TOKEN_COOKIE_NAMES];

  for (const cookieName of cookieNames) {
    // Why: clear both HttpOnly and non-HttpOnly variants during migration so
    // old JS-written cookies and new server cookies are both invalidated.
    // This helper now clears both access and refresh token cookie families.
    for (const httpOnly of [true, false]) {
      response.cookies.set({
        name: cookieName,
        value: "",
        httpOnly,
        sameSite: "lax",
        secure: isSecureCookieEnabled(),
        path: "/",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }
}
