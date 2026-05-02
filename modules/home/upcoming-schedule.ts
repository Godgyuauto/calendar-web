import type { FamilyEvent } from "@/modules/family";
import type { ScheduleDetailItem } from "@/modules/calendar-ui/schedule-detail-types";
import {
  parseStructuredOverrideNote,
} from "@/modules/family/domain/structured-override-note";
import type { ShiftOverride } from "@/modules/shift";

export type UpcomingScheduleItem = ScheduleDetailItem;

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

function toSeoulDateKeyFromIso(value: string): string {
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value);
  const date = new Date(hasTimeZone ? value : `${value}+09:00`);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getOverrideNote(override: ShiftOverride) {
  return parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
}

function toOverrideUpcomingItem(override: ShiftOverride): UpcomingScheduleItem {
  const note = getOverrideNote(override);
  const eventType = note?.event_type ?? override.overrideType;
  const shiftChange = note?.shift_change ?? override.overrideShift ?? "KEEP";
  const sourceId = override.id ?? `${override.date}:${override.label}`;
  return {
    id: `override:${sourceId}`,
    sourceId,
    title: note?.title.trim() || override.label,
    dateKey: override.date,
    startTime: note?.start_at ?? override.startTime ?? toSeoulStartIso(override.date),
    endTime: note?.end_at ?? override.endTime ?? null,
    allDay: note?.all_day ?? override.startTime === null,
    eventType,
    shiftChange,
    memo: note?.memo ?? "",
    remindAt: note?.remind_at ?? null,
    source: "override",
  };
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
      sourceId: event.id,
      title: event.title,
      dateKey: toSeoulDateKeyFromIso(event.startTime),
      startTime: event.startTime,
      endTime: event.endTime,
      allDay: false,
      eventType: null,
      shiftChange: null,
      memo: "",
      remindAt: null,
      source: "event" as const,
    }));

  const overrideItems = input.overrides
    .filter(
      (override) =>
        override.date >= input.window.startDateKey &&
        override.date < input.window.endDateKey,
    )
    .map(toOverrideUpcomingItem);

  return [...eventItems, ...overrideItems].sort((left, right) =>
    left.startTime.localeCompare(right.startTime),
  );
}
