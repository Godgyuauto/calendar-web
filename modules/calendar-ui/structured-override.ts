import type { OverrideType, ShiftCode } from "@/modules/shift";
import {
  parseStructuredNote,
  toDateTimeLocalOrNull,
  type StructuredOverrideNoteV1,
} from "@/modules/calendar-ui/structured-override-note";

interface OverrideRecordLike {
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export interface EventTypeOption {
  id: OverrideType;
  emoji: string;
  label: string;
}

export interface StructuredOverrideFormState {
  eventType: OverrideType;
  shiftChange: ShiftCode | "KEEP";
  startAt: string;
  endAt: string;
  remindAt: string;
  title: string;
  memo: string;
}

export interface OverrideSubmitPayload {
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime: string | null;
  endTime: string | null;
  note: string;
}

export interface StructuredOverrideDisplay {
  title: string;
  eventType: OverrideType;
  shiftChange: ShiftCode | "KEEP";
  allDay: boolean;
  startAt: string | null;
  endAt: string | null;
  remindAt: string | null;
  memo: string;
}

export const EVENT_TYPE_OPTIONS: EventTypeOption[] = [
  { id: "vacation", emoji: "🏖", label: "휴가" },
  { id: "training", emoji: "📚", label: "교육" },
  { id: "swap", emoji: "🔄", label: "교대" },
  { id: "extra", emoji: "⏰", label: "추가근무" },
  { id: "sick", emoji: "🏥", label: "병가" },
  { id: "business", emoji: "✈️", label: "출장" },
  { id: "custom", emoji: "✏️", label: "커스텀" },
];

export const SHIFT_CHANGE_OPTIONS: (ShiftCode | "KEEP")[] = ["A", "B", "C", "OFF", "KEEP"];
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function toTimeInputOrEmpty(value: string | null | undefined): string {
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

function toDateTimeFromDateAndTime(dateKey: string, hhmm: string): string | null {
  const normalized = hhmm.trim();
  if (!TIME_PATTERN.test(normalized)) {
    return null;
  }

  return `${dateKey}T${normalized}`;
}

export function getEventTypeOption(type: OverrideType): EventTypeOption {
  return EVENT_TYPE_OPTIONS.find((option) => option.id === type) ?? EVENT_TYPE_OPTIONS[0];
}

export function toStructuredOverrideFormState(input: {
  dateKey: string;
  override?: OverrideRecordLike | null;
}): StructuredOverrideFormState {
  const override = input.override;
  const note = parseStructuredNote(override?.note, {
    eventType: override?.overrideType,
    shiftChange: override?.overrideShift ?? "KEEP",
  });
  const eventType = note?.event_type ?? override?.overrideType ?? "vacation";
  const fallbackTitle = override
    ? override.label.trim() === getEventTypeOption(eventType).label
      ? ""
      : override.label.trim()
    : "";

  return {
    eventType,
    shiftChange: note?.shift_change ?? override?.overrideShift ?? "KEEP",
    startAt: toTimeInputOrEmpty(note?.start_at ?? override?.startTime),
    endAt: toTimeInputOrEmpty(note?.end_at ?? override?.endTime),
    remindAt: toDateTimeLocalOrNull(note?.remind_at) ?? "",
    title: note?.title ?? fallbackTitle,
    memo: note?.memo ?? "",
  };
}

export function toStructuredOverrideDisplay(
  override: OverrideRecordLike,
): StructuredOverrideDisplay {
  const note = parseStructuredNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const eventType = note?.event_type ?? override.overrideType;
  return {
    title: note ? note.title : override.label.trim(),
    eventType,
    shiftChange: note?.shift_change ?? override.overrideShift ?? "KEEP",
    allDay: note?.all_day ?? !(override.startTime || override.endTime),
    startAt: note?.start_at ?? toDateTimeLocalOrNull(override.startTime),
    endAt: note?.end_at ?? toDateTimeLocalOrNull(override.endTime),
    remindAt: note?.remind_at ?? null,
    memo: note?.memo ?? "",
  };
}

export function getMonthGridOverrideLabel(override: OverrideRecordLike): string {
  const note = parseStructuredNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  // Structured records show a compact summary so the month grid reflects
  // typed title + event type + shift-change intent (when available).
  if (note) {
    const title = note.title.trim();
    const eventTypeLabel = getEventTypeOption(note.event_type).label;
    const shiftChangeLabel = note.shift_change === "KEEP" ? "유지" : note.shift_change;

    if (title) {
      return `${title} · ${eventTypeLabel}/${shiftChangeLabel}`;
    }

    return note.shift_change === "KEEP"
      ? eventTypeLabel
      : `${eventTypeLabel}/${shiftChangeLabel}`;
  }
  return override.label.trim();
}

export function toOverrideSubmitPayload(
  dateKey: string,
  form: StructuredOverrideFormState,
): OverrideSubmitPayload {
  const title = form.title.trim();
  const memo = form.memo.trim();
  const shiftChange = form.shiftChange;
  const startAt = toDateTimeFromDateAndTime(dateKey, form.startAt);
  const endAt = toDateTimeFromDateAndTime(dateKey, form.endAt);
  const hasRange = Boolean(startAt && endAt);
  const eventLabel = title || getEventTypeOption(form.eventType).label;
  const remindAt = form.remindAt.trim();
  // Persist explicit structured fields in `note` so edit/view logic does not depend on free text.
  const notePayload: StructuredOverrideNoteV1 = {
    schema: "calendar_override_v1",
    event_type: form.eventType,
    shift_change: shiftChange,
    all_day: !hasRange,
    start_at: hasRange ? startAt : null,
    end_at: hasRange ? endAt : null,
    remind_at: remindAt ? toDateTimeLocalOrNull(remindAt) : null,
    title,
    memo,
  };

  return {
    date: dateKey,
    overrideType: form.eventType,
    overrideShift: shiftChange === "KEEP" ? null : shiftChange,
    label: eventLabel,
    startTime: notePayload.start_at,
    endTime: notePayload.end_at,
    note: JSON.stringify(notePayload),
  };
}
