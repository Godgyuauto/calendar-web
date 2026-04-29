import { toDateTimeLocalOrNull } from "@/modules/calendar-ui/structured-override-note";

const TIME_PATTERN = /^\d{2}:\d{2}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function toDateInputOrDefault(
  value: string | null | undefined,
  defaultDate: string,
): string {
  if (!value) {
    return defaultDate;
  }
  if (DATE_PATTERN.test(value)) {
    return value;
  }

  const localDateTime = toDateTimeLocalOrNull(value);
  if (!localDateTime) {
    return defaultDate;
  }

  return localDateTime.slice(0, 10);
}

export function toTimeInputOrEmpty(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  if (TIME_PATTERN.test(value)) {
    return value;
  }

  const localDateTime = toDateTimeLocalOrNull(value);
  if (!localDateTime) {
    return "";
  }

  return localDateTime.slice(11, 16);
}

export function toDateTimeFromDateAndTime(dateKey: string, hhmm: string): string | null {
  const normalized = hhmm.trim();
  if (!DATE_PATTERN.test(dateKey)) {
    return null;
  }
  if (!TIME_PATTERN.test(normalized)) {
    return null;
  }

  return `${dateKey}T${normalized}`;
}
