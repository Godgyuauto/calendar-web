import { NextRequest, NextResponse } from "next/server";
import {
  type FamilyAuthContext,
  getApiAuthFailure,
  resolveFamilyAuthContext,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/auth-context";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";

async function runAuthOrResponse(
  resolver: () => Promise<FamilyAuthContext>,
): Promise<FamilyAuthContext | NextResponse> {
  try {
    return await resolver();
  } catch (error) {
    const failure = getApiAuthFailure(error);
    if (failure) {
      return NextResponse.json({ error: failure.message }, { status: failure.status });
    }

    throw error;
  }
}

export async function resolveFamilyAuthOrResponse(
  request: NextRequest,
): Promise<FamilyAuthContext | NextResponse> {
  return runAuthOrResponse(() => resolveFamilyAuthContext(request));
}

// Browser clients (e.g. PushNotificationCard) cannot send Authorization headers
// on fetch() without extra plumbing, so we fall back to the access-token cookie.
export async function resolveFamilyAuthOrResponseWithCookie(
  request: NextRequest,
): Promise<FamilyAuthContext | NextResponse> {
  return runAuthOrResponse(async () => {
    if (request.headers.get("authorization")) {
      return resolveFamilyAuthContext(request);
    }

    // Read from this request's Cookie header first so API routes do not depend
    // on global cookie state from unrelated server render contexts.
    const cookieToken = await getServerAccessTokenFromCookies(request.headers.get("cookie"));
    if (cookieToken) {
      return resolveFamilyAuthContextFromToken(cookieToken);
    }

    return resolveFamilyAuthContext(request);
  });
}
