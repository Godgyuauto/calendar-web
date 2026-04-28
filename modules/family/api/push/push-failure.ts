export type PushFailureCode =
  | "PUSH_PERMISSION_DENIED"
  | "PUSH_UNSUPPORTED_ENVIRONMENT"
  | "PUSH_SUBSCRIPTION_EXPIRED"
  | "PUSH_SEND_FAILED"
  | "PUSH_PAYLOAD_INVALID"
  | "PUSH_REPOSITORY_FAILED"
  | "PUSH_CONFIG_MISSING";

export interface PushFailure {
  code: PushFailureCode;
  status: number;
  message: string;
  retryable: boolean;
  shouldDeleteSubscription: boolean;
}

export interface PushFailureSummary {
  code: PushFailureCode;
  count: number;
  retryable: boolean;
  cleaned: number;
  cleanupFailed: number;
}

const RETRYABLE_SEND_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const EXPIRED_SUBSCRIPTION_STATUSES = new Set([404, 410]);

function readStatusCode(error: unknown): number | null {
  if (typeof error !== "object" || error === null || !("statusCode" in error)) {
    return null;
  }

  const statusCode = Number((error as { statusCode?: unknown }).statusCode);
  return Number.isInteger(statusCode) ? statusCode : null;
}

export function classifyPushSendFailure(error: unknown): PushFailure {
  const statusCode = readStatusCode(error);

  if (statusCode !== null && EXPIRED_SUBSCRIPTION_STATUSES.has(statusCode)) {
    return {
      code: "PUSH_SUBSCRIPTION_EXPIRED",
      status: statusCode,
      message: `Push subscription expired or is gone. status=${statusCode}`,
      retryable: false,
      shouldDeleteSubscription: true,
    };
  }

  if (statusCode !== null && RETRYABLE_SEND_STATUSES.has(statusCode)) {
    return {
      code: "PUSH_SEND_FAILED",
      status: statusCode,
      message: `Push send failed with a retryable provider status. status=${statusCode}`,
      retryable: true,
      shouldDeleteSubscription: false,
    };
  }

  return {
    code: "PUSH_SEND_FAILED",
    status: statusCode ?? 503,
    message:
      error instanceof Error && error.message.length > 0
        ? error.message
        : "Push send failed.",
    retryable: false,
    shouldDeleteSubscription: false,
  };
}

export function classifyPushSubscriptionPayloadFailure(body: unknown): PushFailure {
  if (typeof body === "object" && body !== null) {
    const raw = body as {
      permission?: unknown;
      pushSupported?: unknown;
      standalone?: unknown;
      reason?: unknown;
    };

    if (raw.permission === "denied") {
      return {
        code: "PUSH_PERMISSION_DENIED",
        status: 403,
        message: "Push permission was denied by the browser.",
        retryable: false,
        shouldDeleteSubscription: false,
      };
    }

    if (
      raw.pushSupported === false ||
      raw.standalone === false ||
      raw.reason === "unsupported" ||
      raw.reason === "ios-browser"
    ) {
      return {
        code: "PUSH_UNSUPPORTED_ENVIRONMENT",
        status: 422,
        message: "Push is not available in this browser or PWA environment.",
        retryable: false,
        shouldDeleteSubscription: false,
      };
    }
  }

  return {
    code: "PUSH_PAYLOAD_INVALID",
    status: 400,
    message: "Invalid push subscription payload.",
    retryable: false,
    shouldDeleteSubscription: false,
  };
}

export function classifyPushPayload(payload: string): PushFailure | null {
  const byteLength = new TextEncoder().encode(payload).length;
  if (byteLength <= 3800) {
    return null;
  }

  return {
    code: "PUSH_PAYLOAD_INVALID",
    status: 413,
    message: `Push payload is too large. bytes=${byteLength}`,
    retryable: false,
    shouldDeleteSubscription: false,
  };
}

export function addPushFailureSummary(
  summaries: PushFailureSummary[],
  failure: PushFailure,
  cleanup: { cleaned: boolean; cleanupFailed: boolean },
): void {
  const existing = summaries.find((summary) => summary.code === failure.code);
  if (existing) {
    existing.count += 1;
    existing.cleaned += cleanup.cleaned ? 1 : 0;
    existing.cleanupFailed += cleanup.cleanupFailed ? 1 : 0;
    return;
  }

  summaries.push({
    code: failure.code,
    count: 1,
    retryable: failure.retryable,
    cleaned: cleanup.cleaned ? 1 : 0,
    cleanupFailed: cleanup.cleanupFailed ? 1 : 0,
  });
}
