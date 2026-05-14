"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ClockTimeSelector } from "@/modules/calendar-ui/ClockTimeSelector";
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

function formatDateTimeSummary(dateKey: string, hhmm: string): string {
  const [hour = "00", minute = "00"] = hhmm.split(":");
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? "오후" : "오전";
  const hour12 = hourNumber % 12 || 12;
  return `${dateKey.slice(5)} ${period} ${hour12}:${minute}`;
}

export function ReminderSection({ form, setForm }: ReminderSectionProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasReminder = form.remindAt.trim().length > 0;
  const reminderDate = toDateInputOrDefault(form.remindAt, form.startDate);
  const reminderTime = toTimeInputOrEmpty(form.remindAt) || fallbackReminderTime(form);

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
              setPickerOpen(false);
              setForm((current) => ({ ...current, remindAt: "" }));
            }}
            variant="segment"
          >
            알림 없음
          </Chip>
          <Chip
            active={hasReminder}
            onClick={() => {
              setPickerOpen(false);
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
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className="grid min-h-[50px] w-full grid-cols-[44px_minmax(0,1fr)] items-center gap-2 rounded-[10px] bg-[#f2f2f7] px-3 text-left"
            >
              <span className="text-[12px] font-semibold text-[#8e8e93]">알림</span>
              <span className="min-w-0 text-right text-[15px] font-semibold text-[#1a1a1a]">
                {formatDateTimeSummary(reminderDate, reminderTime)}
              </span>
            </button>

            {pickerOpen ? (
              <div className="rounded-[12px] border border-[#e5e5ea] bg-white p-3">
                <div className="mb-2 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#8e8e93]">날짜</span>
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
                </div>
                <ClockTimeSelector
                  value={reminderTime}
                  onChange={updateReminderTime}
                  minuteInputLabel="알림 분 직접 입력"
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="mt-3 h-10 w-full rounded-[10px] bg-[#f2f2f7] text-[13px] font-semibold text-[#1a1a1a]"
                >
                  완료
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </>
  );
}
