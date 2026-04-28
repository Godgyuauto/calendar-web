import { toDateTimeLocalOrNull } from "@/modules/calendar-ui/structured-override-note";

const TIME_PATTERN = /^\d{2}:\d{2}$/;

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
  if (!TIME_PATTERN.test(normalized)) {
    return null;
  }

  return `${dateKey}T${normalized}`;
}
