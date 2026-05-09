import {
  parseStructuredNote,
  toDateTimeLocalOrNull,
  type StructuredOverrideNoteV1,
} from "@/modules/calendar-ui/structured-override-note";
import { getEventTypeOption } from "@/modules/calendar-ui/structured-override-options";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import {
  toDateTimeFromDateAndTime,
  toDateInputOrDefault,
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
  const eventType = note?.event_type ?? override?.overrideType ?? "custom";
  const fallbackTitle = override
    ? override.label.trim() === getEventTypeOption(eventType).label
      ? ""
      : override.label.trim()
    : "";
  const startSource = note?.start_at ?? override?.startTime;
  const endSource = note?.end_at ?? override?.endTime;

  return {
    eventType,
    shiftChange: note?.shift_change ?? override?.overrideShift ?? "KEEP",
    startDate: toDateInputOrDefault(startSource, input.dateKey),
    endDate: toDateInputOrDefault(endSource, input.dateKey),
    startAt: toTimeInputOrEmpty(startSource),
    endAt: toTimeInputOrEmpty(endSource),
    remindAt: toDateTimeLocalOrNull(note?.remind_at) ?? "",
    title: note?.title ?? fallbackTitle,
    memo: note?.memo ?? "",
    leaveDeductionHours: note?.leave_deduction_hours ?? 8,
    leaveDeductionLabel: note?.leave_deduction_label ?? "연차",
    leaveExemptFromDeduction: note?.leave_exempt_from_deduction ?? false,
  };
}

export function toOverrideSubmitPayload(
  dateKey: string,
  form: StructuredOverrideFormState,
): OverrideSubmitPayload {
  const title = form.title.trim();
  const memo = form.memo.trim();
  const shiftChange = form.shiftChange;
  const startAt = toDateTimeFromDateAndTime(form.startDate, form.startAt);
  const endAt = toDateTimeFromDateAndTime(form.endDate, form.endAt);
  const hasRange = Boolean(startAt && endAt);
  const eventLabel = title || getEventTypeOption(form.eventType).label;
  const remindAt = form.remindAt.trim();
  const leaveDeduction =
    form.eventType === "vacation"
      ? normalizeLeaveDeduction(form.leaveDeductionHours ?? 8)
      : null;
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
    leave_deduction_hours: leaveDeduction?.hours,
    leave_deduction_label: leaveDeduction?.label,
    leave_exempt_from_deduction: form.leaveExemptFromDeduction ?? false,
  };

  return {
    date: dateKey,
    overrideType: form.eventType,
    overrideShift: shiftChange === "KEEP" ? null : shiftChange,
    label: eventLabel,
    startTime: toSeoulOffsetDateTime(notePayload.start_at),
    endTime: toSeoulOffsetDateTime(notePayload.end_at),
    note: JSON.stringify(notePayload),
  };
}

function toSeoulOffsetDateTime(value: string | null): string | null {
  return value ? `${value}:00+09:00` : null;
}
