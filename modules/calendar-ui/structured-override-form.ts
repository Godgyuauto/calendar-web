import {
  parseStructuredNote,
  toDateTimeLocalOrNull,
  type StructuredOverrideNoteV1,
} from "@/modules/calendar-ui/structured-override-note";
import { getEventTypeOption } from "@/modules/calendar-ui/structured-override-options";
import { normalizeLeaveDeduction } from "@/modules/leave/annual-leave-deduction";
import { isKoreanPublicHoliday } from "@/modules/leave/korean-public-holidays";
import {
  normalizeLeaveTargets,
  normalizeSubjectType,
} from "@/modules/calendar-ui/structured-override-leave-targets";
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
import type { LeaveDeductionLabel } from "@/modules/leave/annual-leave-deduction";

interface InheritedAnnualLeaveDeduction {
  hours: number;
  label: LeaveDeductionLabel;
  exempt: boolean;
}

function toSortTimestamp(value?: string | null): number {
  if (!value) {
    return Number.POSITIVE_INFINITY;
  }
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? value : `${value}+09:00`;
  const timestamp = new Date(normalized).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.POSITIVE_INFINITY;
}

function getInheritedAnnualLeaveDeduction(
  dateKey: string,
  overrides: OverrideRecordLike[] | undefined,
): InheritedAnnualLeaveDeduction | null {
  const vacationOverrides = (overrides ?? [])
    .filter((candidate) => candidate.date === dateKey)
    .map((candidate) => ({
      override: candidate,
      note: parseStructuredNote(candidate.note, {
        eventType: candidate.overrideType,
        shiftChange: candidate.overrideShift ?? "KEEP",
      }),
    }))
    .filter(({ override, note }) => (note?.event_type ?? override.overrideType) === "vacation")
    .sort((left, right) => {
      const leftStart = toSortTimestamp(left.override.startTime ?? left.note?.start_at);
      const rightStart = toSortTimestamp(right.override.startTime ?? right.note?.start_at);
      return leftStart - rightStart;
    });

  const earliest = vacationOverrides[0];
  if (!earliest) {
    return null;
  }

  return {
    hours: earliest.note?.leave_deduction_hours ?? 8,
    label: earliest.note?.leave_deduction_label ?? "연차",
    exempt: earliest.note?.leave_exempt_from_deduction ?? false,
  };
}

export function toStructuredOverrideFormState(input: {
  dateKey: string;
  override?: OverrideRecordLike | null;
  sameDayOverrides?: OverrideRecordLike[];
  defaultSubjectUserId?: string | null;
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
  const inheritedDeduction = override
    ? null
    : getInheritedAnnualLeaveDeduction(input.dateKey, input.sameDayOverrides);
  const subjectType = note?.subject_type ?? "member";
  const subjectUserId =
    subjectType === "member"
      ? note?.subject_user_id ?? override?.userId ?? input.defaultSubjectUserId ?? null
      : null;

  return {
    eventType,
    shiftChange: note?.shift_change ?? override?.overrideShift ?? "KEEP",
    subjectType,
    subjectUserId,
    startDate: toDateInputOrDefault(startSource, input.dateKey),
    endDate: toDateInputOrDefault(endSource, input.dateKey),
    startAt: toTimeInputOrEmpty(startSource),
    endAt: toTimeInputOrEmpty(endSource),
    remindAt: toDateTimeLocalOrNull(note?.remind_at) ?? "",
    title: note?.title ?? fallbackTitle,
    memo: note?.memo ?? "",
    leaveDeductionHours: note?.leave_deduction_hours ?? inheritedDeduction?.hours ?? 8,
    leaveDeductionLabel: note?.leave_deduction_label ?? inheritedDeduction?.label ?? "연차",
    leaveExemptFromDeduction:
      note?.leave_exempt_from_deduction ?? inheritedDeduction?.exempt ?? false,
    leaveTargets: note?.leave_targets ?? [],
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
  const leaveExempt =
    form.eventType === "vacation" &&
    (isKoreanPublicHoliday(form.startDate) || (form.leaveExemptFromDeduction ?? false));
  const subjectType = normalizeSubjectType(form.subjectType);
  const subjectUserId = subjectType === "member" ? form.subjectUserId ?? null : null;
  const leaveTargets = normalizeLeaveTargets(form, {
    subjectType,
    subjectUserId,
    leaveExempt,
  });
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
    leave_exempt_from_deduction: leaveExempt,
    subject_type: subjectType,
    subject_user_id: subjectUserId,
    leave_targets: leaveTargets,
  };

  return {
    userId: subjectUserId ?? undefined,
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
