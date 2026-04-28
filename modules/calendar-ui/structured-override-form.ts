import {
  parseStructuredNote,
  toDateTimeLocalOrNull,
  type StructuredOverrideNoteV1,
} from "@/modules/calendar-ui/structured-override-note";
import { getEventTypeOption } from "@/modules/calendar-ui/structured-override-options";
import {
  toDateTimeFromDateAndTime,
  toTimeInputOrEmpty,
} from "@/modules/calendar-ui/structured-override-time";
import type {
  OverrideRecordLike,
  OverrideSubmitPayload,
  StructuredOverrideFormState,
} from "@/modules/calendar-ui/structured-override-types";

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
