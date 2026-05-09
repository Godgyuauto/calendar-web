import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import type { ShiftOverride } from "@/modules/shift";
import { ANNUAL_LEAVE_HOURS_PER_DAY, type AnnualLeaveUsage } from "./annual-leave";
import { isKoreanPublicHoliday } from "./korean-public-holidays";

export interface AnnualLeaveUsageDetail extends AnnualLeaveUsage {
  date: string;
  title: string;
  deductionLabel: string;
  exemptReason: "public_holiday" | "company_holiday" | null;
}

function toTimestamp(value: string | null | undefined): number | null {
  if (!value) {
    return null;
  }
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`;
  const timestamp = new Date(normalized).getTime();
  return Number.isFinite(timestamp) ? timestamp : null;
}

function calculateTimedUsageHours(startAt: string | null, endAt: string | null): number {
  const startMs = toTimestamp(startAt);
  const endMs = toTimestamp(endAt);
  if (startMs === null || endMs === null || endMs <= startMs) {
    return ANNUAL_LEAVE_HOURS_PER_DAY;
  }

  const hours = Math.ceil((endMs - startMs) / 3_600_000);
  return Math.min(ANNUAL_LEAVE_HOURS_PER_DAY, Math.max(1, hours));
}

function getAnnualLeaveUsageDetailFromOverride(
  override: ShiftOverride,
): AnnualLeaveUsageDetail | null {
  const note = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const eventType = note?.event_type ?? override.overrideType;
  if (eventType !== "vacation") {
    return null;
  }
  const title = note?.title || override.label || "연차";
  const publicHoliday = isKoreanPublicHoliday(override.date);

  if (publicHoliday || note?.leave_exempt_from_deduction) {
    return {
      date: override.date,
      title,
      hours: 0,
      deductionLabel: note?.leave_deduction_label ?? "연차",
      exemptReason: publicHoliday ? "public_holiday" : "company_holiday",
    };
  }

  if (note?.leave_deduction_hours) {
    return {
      date: override.date,
      title,
      hours: Math.min(ANNUAL_LEAVE_HOURS_PER_DAY, note.leave_deduction_hours),
      deductionLabel: note.leave_deduction_label ?? "연차",
      exemptReason: null,
    };
  }

  const allDay = note?.all_day ?? !(override.startTime && override.endTime);
  if (allDay) {
    return {
      date: override.date,
      title,
      hours: ANNUAL_LEAVE_HOURS_PER_DAY,
      deductionLabel: "연차",
      exemptReason: null,
    };
  }

  return {
    date: override.date,
    title,
    hours: calculateTimedUsageHours(
      note?.start_at ?? override.startTime ?? null,
      note?.end_at ?? override.endTime ?? null,
    ),
    deductionLabel: "시간 연차",
    exemptReason: null,
  };
}

export function getAnnualLeaveUsageFromOverride(
  override: ShiftOverride,
): AnnualLeaveUsage | null {
  const detail = getAnnualLeaveUsageDetailFromOverride(override);
  return detail ? { hours: detail.hours } : null;
}

export function getAnnualLeaveUsagesFromOverrides(
  overrides: ShiftOverride[],
  year: number,
): AnnualLeaveUsage[] {
  return overrides
    .filter((override) => override.date.startsWith(`${year}-`))
    .map(getAnnualLeaveUsageFromOverride)
    .filter((usage): usage is AnnualLeaveUsage => usage !== null);
}

export function getAnnualLeaveUsageDetailsFromOverrides(
  overrides: ShiftOverride[],
  year: number,
): AnnualLeaveUsageDetail[] {
  return overrides
    .filter((override) => override.date.startsWith(`${year}-`))
    .map(getAnnualLeaveUsageDetailFromOverride)
    .filter((usage): usage is AnnualLeaveUsageDetail => usage !== null);
}
