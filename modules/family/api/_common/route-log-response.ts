import { NextResponse } from "next/server";
import { type ApiLogScope, logApiFailure, logApiSuccess } from "./request-log";

export interface RouteLogMeta {
  familyId?: string;
  userId?: string;
}

function pickMeta(meta?: RouteLogMeta): RouteLogMeta {
  if (!meta) {
    return {};
  }

  return {
    familyId: meta.familyId,
    userId: meta.userId,
  };
}

export function responseForAuthFailure(scope: ApiLogScope, response: NextResponse): NextResponse {
  logApiFailure(scope, {
    status: response.status,
    errorCode: "AUTH",
    message: "Authorization rejected.",
  });
  return response;
}

export function responseForFailure(
  scope: ApiLogScope,
  status: number,
  message: string,
  errorCode: string,
  meta?: RouteLogMeta,
): NextResponse {
  logApiFailure(scope, {
    status,
    errorCode,
    message,
    ...pickMeta(meta),
  });
  return NextResponse.json({ error: message }, { status });
}

export function responseForSuccess(
  scope: ApiLogScope,
  body: unknown,
  status: number,
  meta?: RouteLogMeta,
): NextResponse {
  logApiSuccess(scope, {
    status,
    ...pickMeta(meta),
  });
  return NextResponse.json(body, { status });
}

export function responseForNoContent(
  scope: ApiLogScope,
  status: number,
  meta?: RouteLogMeta,
): NextResponse {
  logApiSuccess(scope, {
    status,
    ...pickMeta(meta),
  });
  return new NextResponse(null, { status });
}

export function logUnexpectedFailure(
  scope: ApiLogScope,
  error: unknown,
  meta?: RouteLogMeta,
): void {
  logApiFailure(scope, {
    status: 500,
    errorCode: "UNEXPECTED",
    message: error instanceof Error ? error.message : "Unexpected error.",
    ...pickMeta(meta),
  });
}
