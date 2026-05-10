import type { OverrideType } from "@/modules/shift";
import { parseStructuredSubjectFields } from "./structured-override-note-subject";
import type {
  ShiftChange,
  StructuredOverrideNoteV1,
} from "./structured-override-note-types";
import {
  readLeaveDeductionLabel,
  readNumber,
} from "@/modules/family/domain/structured-override-note-leave";

export type { ShiftChange, StructuredOverrideNoteV1 };

const OVERRIDE_TYPES: OverrideType[] = [
  "vacation",
  "training",
  "swap",
  "extra",
  "sick",
  "business",
  "custom",
];
const SHIFT_CHANGES: ShiftChange[] = ["A", "B", "C", "OFF", "KEEP"];

function asObject(note: string | null | undefined): Record<string, unknown> | null {
  if (!note) {
    return null;
  }
  try {
    const parsed = JSON.parse(note);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readString(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : "";
    }
  }
  return null;
}

function readBoolean(
  source: Record<string, unknown>,
  keys: readonly string[],
): boolean | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "boolean") {
      return value;
    }
  }
  return null;
}

function normalizeOverrideType(
  value: string | null,
  fallback: OverrideType,
): OverrideType {
  if (!value) {
    return fallback;
  }
  return OVERRIDE_TYPES.includes(value as OverrideType)
    ? (value as OverrideType)
    : fallback;
}

function normalizeShiftChange(
  value: string | null,
  fallback: ShiftChange,
): ShiftChange {
  if (!value) {
    return fallback;
  }
  return SHIFT_CHANGES.includes(value as ShiftChange)
    ? (value as ShiftChange)
    : fallback;
}

function readDateTimeLike(
  source: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  const value = readString(source, keys);
  if (value === null) {
    return null;
  }

  return value;
}

function hasStructuredFields(source: Record<string, unknown>): boolean {
  const knownKeys = [
    "schema",
    "event_type",
    "eventType",
    "override_type",
    "shift_change",
    "shiftChange",
    "shift_override",
    "title",
    "memo",
    "start_at",
    "startAt",
    "end_at",
    "endAt",
    "remind_at",
    "remindAt",
    "leave_deduction_hours",
    "leaveDeductionHours",
    "leave_deduction_label",
    "leaveDeductionLabel",
    "leave_exempt_from_deduction",
    "leaveExemptFromDeduction",
    "subject_type",
    "subject_user_id",
    "leave_targets",
  ];

  return knownKeys.some((key) => key in source);
}

// Parse both canonical note schema and legacy/camelCase variants into one
// normalized shape so rendering/notification code can keep a single path.
export function parseStructuredOverrideNote(
  note: string | null | undefined,
  fallback?: {
    eventType?: OverrideType;
    shiftChange?: ShiftChange;
  },
): StructuredOverrideNoteV1 | null {
  const parsed = asObject(note);
  if (!parsed) {
    return null;
  }
  if (!hasStructuredFields(parsed)) {
    return null;
  }

  const eventType = normalizeOverrideType(
    readString(parsed, ["event_type", "eventType", "override_type", "overrideType", "type"]),
    fallback?.eventType ?? "vacation",
  );
  const shiftChange = normalizeShiftChange(
    readString(parsed, [
      "shift_change",
      "shiftChange",
      "shift_override",
      "shiftOverride",
      "override_shift",
      "overrideShift",
    ]),
    fallback?.shiftChange ?? "KEEP",
  );
  const startAt = readDateTimeLike(parsed, ["start_at", "startAt", "start_time", "startTime"]);
  const endAt = readDateTimeLike(parsed, ["end_at", "endAt", "end_time", "endTime"]);
  const allDay = readBoolean(parsed, ["all_day", "allDay"]) ?? !(startAt && endAt);

  return {
    schema: "calendar_override_v1",
    event_type: eventType,
    shift_change: shiftChange,
    all_day: allDay,
    start_at: startAt,
    end_at: endAt,
    remind_at: readDateTimeLike(parsed, ["remind_at", "remindAt", "alarm_at", "alarmAt"]),
    title: readString(parsed, ["title", "event_title", "eventTitle", "label"]) ?? "",
    memo: readString(parsed, ["memo", "description", "desc"]) ?? "",
    leave_deduction_hours: readNumber(parsed, [
      "leave_deduction_hours",
      "leaveDeductionHours",
    ]),
    leave_deduction_label: readLeaveDeductionLabel(
      readString(parsed, ["leave_deduction_label", "leaveDeductionLabel"]),
    ),
    leave_exempt_from_deduction:
      readBoolean(parsed, ["leave_exempt_from_deduction", "leaveExemptFromDeduction"]) ??
      false,
    ...parseStructuredSubjectFields(parsed),
  };
}
