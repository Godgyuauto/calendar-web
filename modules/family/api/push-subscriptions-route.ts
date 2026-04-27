import { NextRequest, NextResponse } from "next/server";
import {
  deleteOwnPushSubscription,
  type PushSubscriptionInput,
  upsertPushSubscription,
} from "@/modules/family/api/push-subscriptions-repository";
import { startApiLog } from "@/modules/family/api/request-log";
import { resolveFamilyAuthOrResponseWithCookie } from "@/modules/family/api/route-auth";
import {
  classifyPushSubscriptionPayloadFailure,
  type PushFailure,
} from "@/modules/family/api/push-failure";
import {
  responseForAuthFailure,
  responseForFailure,
  responseForNoContent,
  responseForSuccess,
} from "@/modules/family/api/route-log-response";

function parsePushSubscriptionBody(body: unknown): PushSubscriptionInput | null {
  if (!body || typeof body !== "object") {
    return null;
  }

  const raw = body as {
    subscription?: {
      endpoint?: unknown;
      keys?: { p256dh?: unknown; auth?: unknown };
    };
  };

  const endpoint = raw.subscription?.endpoint;
  const p256dh = raw.subscription?.keys?.p256dh;
  const auth = raw.subscription?.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    endpoint.length === 0 ||
    typeof p256dh !== "string" ||
    p256dh.length === 0 ||
    typeof auth !== "string" ||
    auth.length === 0
  ) {
    return null;
  }

  return {
    endpoint,
    keys: { p256dh, auth },
  };
}

async function readPushSubscriptionBody(request: NextRequest): Promise<unknown | PushFailure> {
  try {
    return await request.json();
  } catch {
    return {
      code: "PUSH_PAYLOAD_INVALID",
      status: 400,
      message: "Push subscription payload must be valid JSON.",
      retryable: false,
      shouldDeleteSubscription: false,
    };
  }
}

function isPushFailure(value: unknown): value is PushFailure {
  return (
    typeof value === "object" &&
    value !== null &&
    "code" in value &&
    "status" in value &&
    "message" in value
  );
}

export async function POST(request: NextRequest) {
  const logScope = startApiLog("/api/push/subscriptions", "POST");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const body = await readPushSubscriptionBody(request);
  if (isPushFailure(body)) {
    return responseForFailure(logScope, body.status, body.message, body.code, auth);
  }

  const subscription = parsePushSubscriptionBody(body);
  if (!subscription) {
    const failure = classifyPushSubscriptionPayloadFailure(body);
    return responseForFailure(logScope, failure.status, failure.message, failure.code, auth);
  }

  try {
    await upsertPushSubscription(
      auth,
      subscription,
      typeof (body as { userAgent?: unknown }).userAgent === "string"
        ? (body as { userAgent: string }).userAgent
        : undefined,
    );

    return responseForSuccess(logScope, { ok: true }, 201, auth);
  } catch (error) {
    return responseForFailure(
      logScope,
      503,
      error instanceof Error ? error.message : "Failed to save push subscription.",
      "PUSH_REPOSITORY_FAILED",
      auth,
    );
  }
}

export async function DELETE(request: NextRequest) {
  const logScope = startApiLog("/api/push/subscriptions", "DELETE");
  const auth = await resolveFamilyAuthOrResponseWithCookie(request);
  if (auth instanceof NextResponse) {
    return responseForAuthFailure(logScope, auth);
  }

  const endpoint = request.nextUrl.searchParams.get("endpoint")?.trim();
  if (!endpoint) {
    return responseForFailure(logScope, 400, "endpoint is required.", "VALIDATION", auth);
  }

  try {
    await deleteOwnPushSubscription(auth, endpoint);
    return responseForNoContent(logScope, 204, auth);
  } catch (error) {
    return responseForFailure(
      logScope,
      503,
      error instanceof Error ? error.message : "Failed to delete push subscription.",
      "PUSH_REPOSITORY_FAILED",
      auth,
    );
  }
}
