import { getMonthGridOverrideLabel } from "@/modules/calendar-ui/structured-override";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import { getScheduleSubjectColor } from "@/modules/calendar-ui/calendar-subject-visuals";
import { toStructuredOverrideDisplay } from "@/modules/calendar-ui/structured-override";
import type { ShiftOverride } from "@/modules/shift";

export interface MonthGridOverrideBadges {
  label: string;
  additionalCount: number;
  color: string;
}

function timestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const unix = new Date(value).getTime();
  return Number.isNaN(unix) ? 0 : unix;
}

export function buildMonthGridOverrideBadges(input: {
  cellDate: string;
  primaryOverride?: ShiftOverride;
  monthOverrides: ShiftOverride[];
  subjectMembers?: CalendarSubjectMember[];
}): MonthGridOverrideBadges | null {
  const dayOverrides = input.monthOverrides.filter(
    (override) => override.date === input.cellDate,
  );
  const primaryOverride =
    input.primaryOverride ??
    dayOverrides
      .slice()
      .sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))[0];

  if (!primaryOverride) {
    return null;
  }

  const display = toStructuredOverrideDisplay(primaryOverride);
  return {
    label: getMonthGridOverrideLabel(primaryOverride),
    additionalCount: Math.max(dayOverrides.length - 1, 0),
    color: getScheduleSubjectColor(
      display.subjectType,
      display.subjectUserId,
      input.subjectMembers ?? [],
    ),
  };
}
