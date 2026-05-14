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
import type { TelegramOverrideLabels } from "./telegram-override-labels";

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

export function buildTelegramOverrideMutationText(
  override: ShiftOverride,
  input: TelegramOverrideLabels & { mode: "create" | "update" },
): string {
  const payload = buildStructuredOverrideNotificationBody(override);
  return [
    input.mode === "create" ? "일정 등록됨" : "일정 수정됨",
    `주체: ${input.subjectLabel}`,
    `${input.mode === "create" ? "추가자" : "수정자"}: ${input.actorLabel}`,
    `제목: ${payload.title}`,
    `일정 유형: ${payload.event_type_label}`,
    `근무조 변경: ${payload.shift_change_label}`,
    `대상 날짜: ${payload.date}`,
    `시간: ${formatScheduleTime(override)}`,
    `알림: ${formatReminderTime(override)}`,
  ].join("\n");
}

export const buildTelegramRegistrationText = (
  override: ShiftOverride,
): string => buildTelegramOverrideMutationText(override, {
  mode: "create",
  subjectLabel: "개인",
  actorLabel: "나",
});

export async function dispatchTelegramMutationForOverride(
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  override: ShiftOverride,
  input: TelegramOverrideLabels & { mode: "create" | "update" },
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
    const result = await sendTelegramMessage(config, buildTelegramOverrideMutationText(override, input));
    if (!result.ok) {
      logApiFailure(scope, {
        status: 202,
        errorCode: "TELEGRAM_SEND_FAILED",
        message: `Telegram ${input.mode} notification failed. status=${result.status} ${result.error ?? ""}`.trim(),
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
          : `Telegram ${input.mode} notification failed.`,
      familyId: auth.familyId,
      userId: auth.userId,
    });
  }
}

export const dispatchTelegramRegistrationForOverride = (
  scope: ApiLogScope,
  auth: FamilyAuthContext,
  override: ShiftOverride,
  labels: TelegramOverrideLabels,
): Promise<void> => dispatchTelegramMutationForOverride(scope, auth, override, {
  ...labels,
  mode: "create",
});
