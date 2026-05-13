import type { ShiftOverride } from "@/modules/shift";
import {
  getTelegramConfigFromEnv,
  sendTelegramMessage,
} from "@/modules/notifications/telegram";
import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import type { FamilyAuthContext } from "../_common/auth-context";
import {
  logApiFailure,
  type ApiLogScope,
} from "../_common/request-log";
import { buildStructuredOverrideNotificationBody } from "../overrides/structured-override-notification";

const TIME_ZONE = "Asia/Seoul";

function toSeoulDate(value: string): Date {
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}:00+09:00`);
}

function formatSeoulDateTime(value: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(toSeoulDate(value));
}

function formatScheduleTime(override: ShiftOverride): string {
  const structured = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const startAt = structured?.start_at ?? override.startTime;
  const endAt = structured?.end_at ?? override.endTime;
  if (structured?.all_day !== false || !startAt || !endAt) {
    return "종일";
  }

  return `${formatSeoulDateTime(startAt)} ~ ${formatSeoulDateTime(endAt)}`;
}

function formatReminderTime(override: ShiftOverride): string {
  const structured = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  if (!structured?.remind_at) {
    return "없음";
  }

  return `${formatSeoulDateTime(structured.remind_at)} (${TIME_ZONE})`;
}

export function buildTelegramRegistrationText(override: ShiftOverride): string {
  const payload = buildStructuredOverrideNotificationBody(override);
  return [
    "일정 등록됨",
    `제목: ${payload.title}`,
    `일정 유형: ${payload.event_type_label}`,
    `근무조 변경: ${payload.shift_change_label}`,
    `대상 날짜: ${payload.date}`,
    `시간: ${formatScheduleTime(override)}`,
    `알림: ${formatReminderTime(override)}`,
  ].join("\n");
}

export async function dispatchTelegramRegistrationForOverride(
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  override: ShiftOverride,
): Promise<void> {
  const config = getTelegramConfigFromEnv();
  if (!config) {
    logApiFailure(scope, {
      status: 202,
      errorCode: "TELEGRAM_CONFIG_MISSING",
      message: "Telegram registration notification skipped: config is missing.",
      familyId: auth.familyId,
      userId: auth.userId,
    });
    return;
  }

  try {
    const result = await sendTelegramMessage(config, buildTelegramRegistrationText(override));
    if (!result.ok) {
      logApiFailure(scope, {
        status: 202,
        errorCode: "TELEGRAM_SEND_FAILED",
        message: `Telegram registration notification failed. status=${result.status} ${result.error ?? ""}`.trim(),
        familyId: auth.familyId,
        userId: auth.userId,
      });
    }
  } catch (error) {
    logApiFailure(scope, {
      status: 202,
      errorCode: "TELEGRAM_SEND_FAILED",
      message:
        error instanceof Error
          ? error.message
          : "Telegram registration notification failed.",
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}
