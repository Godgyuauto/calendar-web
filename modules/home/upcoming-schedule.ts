import type { FamilyEvent } from "@/modules/family";
import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import type { ShiftOverride } from "@/modules/shift";

export interface UpcomingScheduleItem {
  id: string;
  title: string;
  startTime: string;
  allDay: boolean;
  source: "event" | "override";
}

export interface UpcomingWindow {
  startDateKey: string;
  endDateKey: string;
  startIso: string;
  endIso: string;
}

function addDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function toSeoulStartIso(dateKey: string): string {
  return `${dateKey}T00:00:00+09:00`;
}

function getOverrideStartTime(override: ShiftOverride): string {
  const note = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  return note?.start_at ?? override.startTime ?? toSeoulStartIso(override.date);
}

function isOverrideAllDay(override: ShiftOverride): boolean {
  const note = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  return note?.all_day ?? override.startTime === null;
}

export function getUpcomingWindow(todayKey: string, days = 7): UpcomingWindow {
  const endDateKey = addDays(todayKey, days);
  return {
    startDateKey: todayKey,
    endDateKey,
    startIso: toSeoulStartIso(todayKey),
    endIso: toSeoulStartIso(endDateKey),
  };
}

export function buildUpcomingScheduleItems(input: {
  events: FamilyEvent[];
  overrides: ShiftOverride[];
  window: UpcomingWindow;
}): UpcomingScheduleItem[] {
  const eventItems = input.events
    .filter((event) => !event.isRoutine)
    .filter(
      (event) =>
        event.startTime >= input.window.startIso &&
        event.startTime < input.window.endIso,
    )
    .map((event) => ({
      id: `event:${event.id}`,
      title: event.title,
      startTime: event.startTime,
      allDay: false,
      source: "event" as const,
    }));

  const overrideItems = input.overrides
    .filter(
      (override) =>
        override.date >= input.window.startDateKey &&
        override.date < input.window.endDateKey,
    )
    .map((override) => ({
      id: `override:${override.id}`,
      title: override.label,
      startTime: getOverrideStartTime(override),
      allDay: isOverrideAllDay(override),
      source: "override" as const,
    }));

  return [...eventItems, ...overrideItems].sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
}
