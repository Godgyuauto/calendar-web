"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  toDateInputOrDefault,
  toDateTimeFromDateAndTime,
  toTimeInputOrEmpty,
} from "@/modules/calendar-ui/structured-override-time";
import {
  Chip,
  SectionLabel,
  TextField,
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

  return (
    <>
      <SectionLabel className="px-0">알림 시각 (선택)</SectionLabel>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Chip
            active={!hasReminder}
            onClick={() => setForm((current) => ({ ...current, remindAt: "" }))}
            variant="segment"
          >
            알림 없음
          </Chip>
          <Chip
            active={hasReminder}
            onClick={() =>
              setForm((current) => ({
                ...current,
                remindAt: toReminderValue(current.startDate, fallbackReminderTime(current)),
              }))
            }
            variant="segment"
          >
            알림 설정
          </Chip>
        </div>

        {hasReminder ? (
          <div className="grid grid-cols-[36px_minmax(124px,1fr)_132px] items-center gap-2">
            <span className="text-[12px] font-semibold text-[#8e8e93]">알림</span>
            <TextField
              type="date"
              value={reminderDate}
              className="min-w-0 px-2 text-center text-[13px] tabular-nums"
              onChange={(event) =>
                setForm((current) => {
                  const time = toTimeInputOrEmpty(current.remindAt) || fallbackReminderTime(current);
                  return { ...current, remindAt: toReminderValue(event.target.value, time) };
                })
              }
            />
            <TextField
              type="time"
              value={reminderTime}
              className="min-w-0 px-2 text-center text-[13px] tabular-nums"
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  remindAt: toReminderValue(
                    toDateInputOrDefault(current.remindAt, current.startDate),
                    event.target.value,
                  ),
                }))
              }
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
