import type { OverrideType, ShiftCode } from "@/modules/shift";
import {
  parseStructuredOverrideNote,
  type StructuredOverrideNoteV1,
} from "@/modules/family/domain/structured-override-note";

export type { StructuredOverrideNoteV1 };

const DATETIME_LOCAL_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function toDateTimeLocalOrNull(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  if (DATETIME_LOCAL_PATTERN.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  // Normalize ISO/offset timestamps from API into `<input type="datetime-local">` shape.
  return formatDateTimeLocal(parsed);
}

export function withDefaultTime(dateKey: string, hhmm: string): string {
  return `${dateKey}T${hhmm}`;
}

export function parseStructuredNote(
  note: string | null | undefined,
  fallback?: {
    eventType?: OverrideType;
    shiftChange?: ShiftCode | "KEEP";
  },
): StructuredOverrideNoteV1 | null {
  return parseStructuredOverrideNote(note, fallback);
}
