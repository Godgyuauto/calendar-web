"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { ClockTimeSelector } from "@/modules/calendar-ui/ClockTimeSelector";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SegmentControl,
  SectionLabel,
  TextField,
} from "@/modules/ui/components";

interface TimeRangeSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

type TimeField = "start" | "end";

function nextDateKey(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, day ?? 1));
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function getEndDateAfterStartDateChange(
  current: StructuredOverrideFormState,
  nextStartDate: string,
): string {
  if (current.endDate === current.startDate) {
    return nextStartDate;
  }
  if (current.endDate === nextDateKey(current.startDate)) {
    return nextDateKey(nextStartDate);
  }
  return current.endDate;
}

function formatDateTimeSummary(dateKey: string, hhmm: string): string {
  const [hour = "00", minute = "00"] = hhmm.split(":");
  const hourNumber = Number(hour);
  const period = hourNumber >= 12 ? "오후" : "오전";
  const hour12 = hourNumber % 12 || 12;
  return `${dateKey.slice(5)} ${period} ${hour12}:${minute}`;
}

function formatRangeSummary(form: StructuredOverrideFormState): string {
  const start = formatDateTimeSummary(form.startDate, form.startAt || "09:00");
  const end = formatDateTimeSummary(form.endDate, form.endAt || "18:00");
  return `${start} - ${end}`;
}

export function TimeRangeSection({ form, setForm }: TimeRangeSectionProps) {
  const hasTime = form.startAt.length > 0 || form.endAt.length > 0;
  const [activeField, setActiveField] = useState<TimeField>("start");
  const [pickerOpen, setPickerOpen] = useState(false);

  const updateDate = (field: TimeField, dateKey: string) => {
    setForm((current) => {
      if (field === "start") {
        return {
          ...current,
          startDate: dateKey,
          endDate: getEndDateAfterStartDateChange(current, dateKey),
        };
      }

      return { ...current, endDate: dateKey };
    });
  };

  const updateTime = (field: TimeField, time: string) => {
    setForm((current) =>
      field === "start"
        ? { ...current, startAt: time }
        : { ...current, endAt: time },
    );
  };

  const activeDate = activeField === "start" ? form.startDate : form.endDate;
  const activeTime =
    activeField === "start"
      ? form.startAt || "09:00"
      : form.endAt || "18:00";

  return (
    <>
      <SectionLabel className="px-0">시간 (선택)</SectionLabel>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Chip
            active={!hasTime}
            onClick={() => {
              setForm((current) => ({
                ...current,
                endDate: current.startDate,
                startAt: "",
                endAt: "",
              }));
              setPickerOpen(false);
            }}
            variant="segment"
          >
            종일
          </Chip>
          <Chip
            active={hasTime}
            onClick={() => {
              setForm((current) => ({
                ...current,
                startAt: current.startAt || "09:00",
                endAt: current.endAt || "18:00",
              }));
              setActiveField("start");
              setPickerOpen(true);
            }}
            variant="segment"
          >
            시간 지정
          </Chip>
        </div>

        {hasTime ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setPickerOpen((open) => !open)}
              className="grid min-h-[54px] w-full grid-cols-[48px_minmax(0,1fr)] items-center gap-2 rounded-[10px] bg-[#f2f2f7] px-3 text-left"
            >
              <span className="text-[12px] font-semibold text-[#8e8e93]">언제</span>
              <span className="min-w-0 text-right text-[13px] font-semibold text-[#1a1a1a]">
                {formatRangeSummary(form)}
              </span>
            </button>

            {pickerOpen ? (
              <div className="rounded-[12px] border border-[#e5e5ea] bg-white p-3">
                <SegmentControl
                  options={[
                    { value: "start", label: "시작" },
                    { value: "end", label: "종료" },
                  ]}
                  value={activeField}
                  onChange={setActiveField}
                  className="mb-3"
                />
                <div className="mb-2 grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#8e8e93]">날짜</span>
                  <TextField
                    type="date"
                    value={activeDate}
                    className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                    onChange={(event) => updateDate(activeField, event.target.value)}
                  />
                </div>
                <ClockTimeSelector
                  value={activeTime}
                  onChange={(time) => updateTime(activeField, time)}
                  minuteInputLabel={`${activeField === "start" ? "시작" : "종료"} 분 직접 입력`}
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
