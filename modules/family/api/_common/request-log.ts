export interface ApiLogScope {
  route: string;
  method: string;
  requestId: string;
  startedAtMs: number;
  commandHint: string;
}

interface ApiResultLogInput {
  status: number;
  familyId?: string;
  userId?: string;
  errorCode?: string;
  message?: string;
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}`;
}

function emitLog(
  level: "info" | "warn" | "error",
  outcome: "success" | "failure",
  scope: ApiLogScope,
  input: ApiResultLogInput,
): void {
  const durationMs = Date.now() - scope.startedAtMs;
  const payload = {
    kind: "api-route",
    level,
    outcome,
    route: scope.route,
    method: scope.method,
    requestId: scope.requestId,
    status: input.status,
    durationMs,
    familyId: input.familyId,
    userId: input.userId,
    errorCode: input.errorCode,
    message: input.message,
    // commandHint: "이 명령어는 이거입니다"를 로그에서 바로 보이게 유지.
    commandHint: scope.commandHint,
    at: new Date().toISOString(),
  };

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
    return;
  }
  if (level === "warn") {
    console.warn(line);
    return;
  }
  console.info(line);
}

export function startApiLog(
  route: string,
  method: string,
  commandHint = "pnpm run verify:release",
): ApiLogScope {
  return {
    route,
    method,
    requestId: createRequestId(),
    startedAtMs: Date.now(),
    commandHint,
  };
}

export function logApiSuccess(scope: ApiLogScope, input: ApiResultLogInput): void {
  emitLog("info", "success", scope, input);
}

export function logApiFailure(scope: ApiLogScope, input: ApiResultLogInput): void {
  const level = input.status >= 500 ? "error" : "warn";
  emitLog(level, "failure", scope, input);
}
