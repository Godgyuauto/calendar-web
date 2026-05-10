import type { CalendarCell } from "@/modules/calendar";
import type { CalendarSubjectMember } from "@/modules/calendar-ui/calendar-subject-types";
import { buildDayAgendaItems, type DayAgendaItem } from "./day-agenda-items";
import type { ShiftOverride } from "@/modules/shift";

export interface WeekAgendaDay {
  dateKey: string;
  dayNumber: number;
  weekdayLabel: string;
  isToday: boolean;
  shift: CalendarCell["shift"];
  items: DayAgendaItem[];
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function addDays(dateKey: string, offset: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function getWeekDateKeys(dateKey: string): string[] {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const weekStart = addDays(dateKey, -date.getUTCDay());
  return Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));
}

export function buildWeekAgendaDays(input: {
  dateKey: string;
  todayKey: string;
  calendarCells: CalendarCell[];
  overrides: ShiftOverride[];
  subjectMembers?: CalendarSubjectMember[];
}): WeekAgendaDay[] {
  const cellByDate = new Map(input.calendarCells.map((cell) => [cell.date, cell]));
  return getWeekDateKeys(input.dateKey).map((dateKey, index) => {
    const cell = cellByDate.get(dateKey);
    return {
      dateKey,
      dayNumber: cell?.day ?? Number(dateKey.slice(8, 10)),
      weekdayLabel: WEEKDAY_LABELS[index],
      isToday: dateKey === input.todayKey,
      shift: cell?.shift,
      items: buildDayAgendaItems(dateKey, input.overrides, input.subjectMembers ?? []),
    };
  });
}

export function offsetWeek(dateKey: string, offset: number): string {
  return addDays(dateKey, offset * 7);
}
