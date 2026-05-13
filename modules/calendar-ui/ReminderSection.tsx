"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  REMINDER_MINUTE_OPTIONS,
  normalizeReminderMinuteInput,
  toReminderTimeParts,
  toReminderTimeValue,
  type ReminderTimeParts,
} from "@/modules/calendar-ui/reminder-time-selection";
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

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function ReminderSection({ form, setForm }: ReminderSectionProps) {
  const hasReminder = form.remindAt.trim().length > 0;
  const reminderDate = toDateInputOrDefault(form.remindAt, form.startDate);
  const reminderTime = toTimeInputOrEmpty(form.remindAt) || fallbackReminderTime(form);
  const reminderParts = toReminderTimeParts(reminderTime);

  const updateReminderTime = (patch: Partial<ReminderTimeParts>) => {
    setForm((current) => {
      const currentDate = toDateInputOrDefault(current.remindAt, current.startDate);
      const currentTime = toTimeInputOrEmpty(current.remindAt) || fallbackReminderTime(current);
      const nextParts = { ...toReminderTimeParts(currentTime), ...patch };
      return {
        ...current,
        remindAt: toReminderValue(currentDate, toReminderTimeValue(nextParts)),
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
          <div className="space-y-2">
            <div className="grid grid-cols-[36px_minmax(0,1fr)] items-center gap-2">
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

            <div className="grid grid-cols-[36px_minmax(0,1fr)] items-start gap-2">
              <span className="pt-2 text-[12px] font-semibold text-[#8e8e93]">시간</span>
              <div className="space-y-2">
                <div className="flex gap-1.5">
                  {(["AM", "PM"] as const).map((period) => (
                    <Chip
                      key={period}
                      active={reminderParts.period === period}
                      onClick={() => updateReminderTime({ period })}
                      variant="segment"
                    >
                      {period === "AM" ? "오전" : "오후"}
                    </Chip>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {HOUR_OPTIONS.map((hour12) => (
                    <Chip
                      key={hour12}
                      active={reminderParts.hour12 === hour12}
                      onClick={() => updateReminderTime({ hour12 })}
                      variant="segment"
                      className="min-w-0"
                    >
                      {hour12}
                    </Chip>
                  ))}
                </div>

                <div className="grid grid-cols-6 gap-1.5">
                  {REMINDER_MINUTE_OPTIONS.map((minute) => (
                    <Chip
                      key={minute}
                      active={reminderParts.minute === minute}
                      onClick={() => updateReminderTime({ minute })}
                      variant="segment"
                      className="min-w-0"
                    >
                      {minute}
                    </Chip>
                  ))}
                </div>

                <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#8e8e93]">분 직접</span>
                  <TextField
                    type="text"
                    inputMode="numeric"
                    value={reminderParts.minute}
                    aria-label="알림 분 직접 입력"
                    className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                    onChange={(event) => {
                      const minute = normalizeReminderMinuteInput(event.target.value);
                      if (minute) {
                        updateReminderTime({ minute });
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
