export type ReminderPeriod = "AM" | "PM";

export interface ReminderTimeParts {
  period: ReminderPeriod;
  hour12: number;
  minute: string;
}

const TIME_PATTERN = /^(\d{2}):(\d{2})$/;

export const REMINDER_MINUTE_OPTIONS = Array.from({ length: 12 }, (_, index) =>
  String(index * 5).padStart(2, "0"),
);

export function toReminderTimeParts(hhmm: string): ReminderTimeParts {
  const match = TIME_PATTERN.exec(hhmm);
  const hour24 = match ? Number(match[1]) : 9;
  const minute = match ? match[2] : "00";
  const period: ReminderPeriod = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return { period, hour12, minute };
}

export function toReminderTimeValue(parts: ReminderTimeParts): string {
  const normalizedHour = Math.min(Math.max(Math.floor(parts.hour12), 1), 12);
  const minuteNumber = Number(parts.minute);
  const normalizedMinute = Number.isFinite(minuteNumber)
    ? Math.min(Math.max(Math.floor(minuteNumber), 0), 59)
    : 0;
  const hour24 =
    parts.period === "PM"
      ? normalizedHour === 12
        ? 12
        : normalizedHour + 12
      : normalizedHour === 12
        ? 0
        : normalizedHour;

  return `${String(hour24).padStart(2, "0")}:${String(normalizedMinute).padStart(2, "0")}`;
}

export function normalizeReminderMinuteInput(value: string): string | null {
  const digits = value.replace(/\D/g, "").slice(0, 2);
  if (!digits) {
    return "00";
  }

  const minute = Number(digits);
  if (!Number.isFinite(minute)) {
    return null;
  }

  return String(Math.min(minute, 59)).padStart(2, "0");
}
