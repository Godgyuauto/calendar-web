import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import type { ShiftOverride } from "@/modules/shift";
import { ANNUAL_LEAVE_HOURS_PER_DAY, type AnnualLeaveUsage } from "./annual-leave";
import { isKoreanPublicHoliday } from "./korean-public-holidays";

export interface AnnualLeaveUsageDetail extends AnnualLeaveUsage {
  date: string;
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

function toStartSortTimestamp(value: string | null | undefined): number {
  const timestamp = toTimestamp(value);
  return timestamp === null ? Number.POSITIVE_INFINITY : timestamp;
}

function compareOverridesByAnnualLeavePriority(
  left: ShiftOverride,
  right: ShiftOverride,
): number {
  const leftStart = toStartSortTimestamp(left.startTime);
  const rightStart = toStartSortTimestamp(right.startTime);
  if (leftStart !== rightStart) {
    return leftStart < rightStart ? -1 : 1;
  }

  return (toTimestamp(right.createdAt) ?? 0) - (toTimestamp(left.createdAt) ?? 0);
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
  const publicHoliday = isKoreanPublicHoliday(override.date);

  if (publicHoliday || note?.leave_exempt_from_deduction) {
    return {
      date: override.date,
      hours: 0,
      deductionLabel: note?.leave_deduction_label ?? "연차",
      exemptReason: publicHoliday ? "public_holiday" : "company_holiday",
    };
  }

  if (note?.leave_deduction_hours) {
    return {
      date: override.date,
      hours: Math.min(ANNUAL_LEAVE_HOURS_PER_DAY, note.leave_deduction_hours),
      deductionLabel: note.leave_deduction_label ?? "연차",
      exemptReason: null,
    };
  }

  const allDay = note?.all_day ?? !(override.startTime && override.endTime);
  if (allDay) {
    return {
      date: override.date,
      hours: ANNUAL_LEAVE_HOURS_PER_DAY,
      deductionLabel: "연차",
      exemptReason: null,
    };
  }

  return {
    date: override.date,
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
  return getAnnualLeaveUsageDetailsFromOverrides(overrides, year).map((usage) => ({
    hours: usage.hours,
  }));
}

export function getAnnualLeaveUsageDetailsFromOverrides(
  overrides: ShiftOverride[],
  year: number,
): AnnualLeaveUsageDetail[] {
  const detailsByDate = new Map<string, AnnualLeaveUsageDetail>();
  const sortedOverrides = overrides
    .filter((override) => override.date.startsWith(`${year}-`))
    .slice()
    .sort(compareOverridesByAnnualLeavePriority);

  for (const override of sortedOverrides) {
    if (detailsByDate.has(override.date)) {
      continue;
    }
    const detail = getAnnualLeaveUsageDetailFromOverride(override);
    if (detail) {
      detailsByDate.set(override.date, detail);
    }
  }

  return Array.from(detailsByDate.values());
}
