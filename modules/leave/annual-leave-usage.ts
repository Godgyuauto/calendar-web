import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import type { ShiftOverride } from "@/modules/shift";
import { ANNUAL_LEAVE_HOURS_PER_DAY, type AnnualLeaveUsage } from "./annual-leave";
import { isKoreanPublicHoliday } from "./korean-public-holidays";

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

export function getAnnualLeaveUsageFromOverride(
  override: ShiftOverride,
): AnnualLeaveUsage | null {
  const note = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const eventType = note?.event_type ?? override.overrideType;
  if (eventType !== "vacation") {
    return null;
  }

  if (isKoreanPublicHoliday(override.date) || note?.leave_exempt_from_deduction) {
    return { hours: 0 };
  }

  if (note?.leave_deduction_hours) {
    return { hours: Math.min(ANNUAL_LEAVE_HOURS_PER_DAY, note.leave_deduction_hours) };
  }

  const allDay = note?.all_day ?? !(override.startTime && override.endTime);
  if (allDay) {
    return { hours: ANNUAL_LEAVE_HOURS_PER_DAY };
  }

  return {
    hours: calculateTimedUsageHours(
      note?.start_at ?? override.startTime ?? null,
      note?.end_at ?? override.endTime ?? null,
    ),
  };
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
