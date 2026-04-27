import { DayShiftSummary } from "@/lib/shift-engine";

export interface CalendarCell {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  weekday: number;
  shift?: DayShiftSummary;
}

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function buildMonthCalendarGrid(input: {
  year: number;
  month: number;
  shifts: DayShiftSummary[];
}): CalendarCell[] {
  const { year, month, shifts } = input;
  const shiftByDate = new Map(shifts.map((shift) => [shift.date, shift]));
  const firstDayWeekIndex = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const currentMonthDayCount = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const prevMonthDayCount = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  const cells: CalendarCell[] = [];

  for (let i = firstDayWeekIndex - 1; i >= 0; i -= 1) {
    const day = prevMonthDayCount - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const date = toDateKey(prevYear, prevMonth, day);
    cells.push({
      date,
      day,
      isCurrentMonth: false,
      weekday: cells.length % 7,
    });
  }

  for (let day = 1; day <= currentMonthDayCount; day += 1) {
    const date = toDateKey(year, month, day);
    cells.push({
      date,
      day,
      isCurrentMonth: true,
      weekday: cells.length % 7,
      shift: shiftByDate.get(date),
    });
  }

  const trailingCount = Math.max(42 - cells.length, 0);
  for (let day = 1; day <= trailingCount; day += 1) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const date = toDateKey(nextYear, nextMonth, day);
    cells.push({
      date,
      day,
      isCurrentMonth: false,
      weekday: cells.length % 7,
    });
  }

  return cells;
}
