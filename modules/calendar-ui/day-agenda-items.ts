import {
  getEventTypeOption,
  toStructuredOverrideDisplay,
} from "@/modules/calendar-ui/structured-override";
import type { ShiftOverride } from "@/modules/shift";

export interface DayAgendaItem {
  id: string;
  overrideId?: string;
  title: string;
  typeLabel: string;
  shiftLabel: string;
  timeLabel: string;
  memo: string;
  sortKey: string;
  actionLabel: string;
}

interface DateTimeParts {
  date: string;
  time: string;
}

function toDateTimeParts(value: string | null): DateTimeParts | null {
  if (!value) {
    return null;
  }

  const compact = value.replace(" ", "T").slice(0, 16);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(compact)) {
    return { date: compact.slice(0, 10), time: compact.slice(11, 16) };
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(parsed);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
  return { date, time };
}

function toCompactDateLabel(date: string): string {
  const [, month, day] = date.split("-");
  return `${Number(month)}.${Number(day)}`;
}

export function formatDayAgendaTime(
  startAt: string | null,
  endAt: string | null,
  allDay: boolean,
): string {
  if (allDay || !startAt || !endAt) {
    return "종일";
  }

  const start = toDateTimeParts(startAt);
  const end = toDateTimeParts(endAt);
  if (!start || !end) {
    return "시간 미정";
  }

  if (start.date === end.date) {
    return `${start.time} - ${end.time}`;
  }

  return `${toCompactDateLabel(start.date)} ${start.time} - ${toCompactDateLabel(end.date)} ${end.time}`;
}

export function buildDayAgendaItems(
  dateKey: string,
  overrides: ShiftOverride[],
): DayAgendaItem[] {
  return overrides
    .filter((override) => override.date === dateKey)
    .map((override, index) => {
      const display = toStructuredOverrideDisplay(override);
      const typeOption = getEventTypeOption(display.eventType);
      const title = display.title.trim() || typeOption.label;
      const shiftLabel =
        display.shiftChange === "KEEP" ? "근무조 유지" : `근무조 ${display.shiftChange}`;
      return {
        id: override.id ?? `${override.date}:${index}`,
        overrideId: override.id,
        title,
        typeLabel: typeOption.label,
        shiftLabel,
        timeLabel: formatDayAgendaTime(display.startAt, display.endAt, display.allDay),
        memo: display.memo.trim(),
        sortKey: display.allDay ? `${dateKey}T00:00` : display.startAt ?? `${dateKey}T00:00`,
        actionLabel: "상세/관리",
      };
    })
    .sort((left, right) =>
      left.sortKey === right.sortKey
        ? left.title.localeCompare(right.title, "ko-KR")
        : left.sortKey.localeCompare(right.sortKey),
    );
}
