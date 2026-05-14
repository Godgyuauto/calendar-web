"use client";

import type { Dispatch, SetStateAction } from "react";
import { CompactDateTimeField } from "@/modules/calendar-ui/CompactDateTimeField";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  toDateInputOrDefault,
  toDateTimeFromDateAndTime,
  toTimeInputOrEmpty,
} from "@/modules/calendar-ui/structured-override-time";
import {
  Chip,
  SectionLabel,
} from "@/modules/ui/components";

interface ReminderSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

function fallbackReminderTime(form: StructuredOverrideFormState): string {
  return form.startAt || "09:00";
}

function toReminderValue(dateKey: string, hhmm: string): string {
  return toDateTimeFromDateAndTime(dateKey, hhmm) ?? "";
}

export function ReminderSection({ form, setForm }: ReminderSectionProps) {
  const hasReminder = form.remindAt.trim().length > 0;
  const reminderDate = toDateInputOrDefault(form.remindAt, form.startDate);
  const reminderTime = toTimeInputOrEmpty(form.remindAt) || fallbackReminderTime(form);

  const updateReminderDate = (dateKey: string) => {
    setForm((current) => {
      const time = toTimeInputOrEmpty(current.remindAt) || fallbackReminderTime(current);
      return { ...current, remindAt: toReminderValue(dateKey, time) };
    });
  };

  const updateReminderTime = (time: string) => {
    setForm((current) => {
      const currentDate = toDateInputOrDefault(current.remindAt, current.startDate);
      return {
        ...current,
        remindAt: toReminderValue(currentDate, time),
      };
    });
  };

  return (
    <>
      <SectionLabel className="px-0">알림 시각 (선택)</SectionLabel>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Chip
            active={!hasReminder}
            onClick={() => {
              setForm((current) => ({ ...current, remindAt: "" }));
            }}
            variant="segment"
          >
            알림 없음
          </Chip>
          <Chip
            active={hasReminder}
            onClick={() => {
              setForm((current) => ({
                ...current,
                remindAt: toReminderValue(current.startDate, fallbackReminderTime(current)),
              }));
            }}
            variant="segment"
          >
            알림 설정
          </Chip>
        </div>

        {hasReminder ? (
          <div className="space-y-2">
            <CompactDateTimeField
              label="알림"
              date={reminderDate}
              time={reminderTime}
              timeLabel="알림 시간 직접 입력"
              onDateChange={updateReminderDate}
              onTimeChange={updateReminderTime}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
