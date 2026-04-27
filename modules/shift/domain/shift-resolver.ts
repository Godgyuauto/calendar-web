import {
  DAY_IN_MS,
  DEFAULT_SHIFT_PATTERN_V1,
  DEFAULT_TIME_ZONE,
} from "@/modules/shift/domain/constants";
import { normalizeDateKey, parseDateKey } from "@/modules/shift/domain/date-key";
import type {
  DayShiftSummary,
  ShiftCode,
  ShiftOverride,
  ShiftPatternConfig,
} from "@/modules/shift/domain/types";

function getDayOffset(seedDateKey: string, dateKey: string): number {
  const seed = parseDateKey(seedDateKey).getTime();
  const target = parseDateKey(dateKey).getTime();
  return Math.floor((target - seed) / DAY_IN_MS);
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function timestamp(value?: string): number {
  if (!value) {
    return 0;
  }

  const unix = new Date(value).getTime();
  return Number.isNaN(unix) ? 0 : unix;
}

export function getShiftForDate(
  date: Date | string,
  pattern: ShiftPatternConfig = DEFAULT_SHIFT_PATTERN_V1,
  options?: { timeZone?: string },
): ShiftCode {
  const timeZone = options?.timeZone ?? DEFAULT_TIME_ZONE;
  const dateKey = normalizeDateKey(date, timeZone);
  const dayOffset = getDayOffset(pattern.seedDate, dateKey);
  const patternIndex = modulo(dayOffset, pattern.shiftCycle.length);
  return pattern.shiftCycle[patternIndex];
}

export function resolveDayShift(
  date: Date | string,
  input?: {
    overrides?: ShiftOverride[];
    pattern?: ShiftPatternConfig;
    timeZone?: string;
  },
): DayShiftSummary {
  const timeZone = input?.timeZone ?? DEFAULT_TIME_ZONE;
  const pattern = input?.pattern ?? DEFAULT_SHIFT_PATTERN_V1;
  const dateKey = normalizeDateKey(date, timeZone);
  const baseShift = getShiftForDate(dateKey, pattern, { timeZone });

  const dayOverrides = (input?.overrides ?? []).filter(
    (override) => override.date === dateKey,
  );

  const selectedOverride = dayOverrides
    .slice()
    .sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt))[0];

  // TODO(policy): overrideShift=null 일 때를 "근무 미정"으로 보여줄지, baseShift를 유지할지 정책 확정 필요.
  const finalShift = selectedOverride?.overrideShift ?? baseShift;

  return {
    date: dateKey,
    baseShift,
    finalShift,
    override: selectedOverride,
  };
}

export function getMonthShiftSummary(input: {
  year: number;
  month: number;
  overrides?: ShiftOverride[];
  pattern?: ShiftPatternConfig;
  timeZone?: string;
}): DayShiftSummary[] {
  const { year, month, overrides, pattern, timeZone } = input;
  const dayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const rows: DayShiftSummary[] = [];

  for (let day = 1; day <= dayCount; day += 1) {
    const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    rows.push(resolveDayShift(dateKey, { overrides, pattern, timeZone }));
  }

  return rows;
}

export function getTodayShiftSummary(input?: {
  overrides?: ShiftOverride[];
  pattern?: ShiftPatternConfig;
  timeZone?: string;
}): DayShiftSummary {
  return resolveDayShift(new Date(), input);
}
