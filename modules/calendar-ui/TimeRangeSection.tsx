"use client";

import type { Dispatch, SetStateAction } from "react";
import { CompactDateTimeField } from "@/modules/calendar-ui/CompactDateTimeField";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SectionLabel,
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

export function TimeRangeSection({ form, setForm }: TimeRangeSectionProps) {
  const hasTime = form.startAt.length > 0 || form.endAt.length > 0;

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
            }}
            variant="segment"
          >
            시간 지정
          </Chip>
        </div>

        {hasTime ? (
          <div className="space-y-2">
            <CompactDateTimeField
              label="시작"
              date={form.startDate}
              time={form.startAt || "09:00"}
              timeLabel="시작 시간 직접 입력"
              onDateChange={(dateKey) => updateDate("start", dateKey)}
              onTimeChange={(time) => updateTime("start", time)}
            />
            <CompactDateTimeField
              label="종료"
              date={form.endDate}
              time={form.endAt || "18:00"}
              timeLabel="종료 시간 직접 입력"
              onDateChange={(dateKey) => updateDate("end", dateKey)}
              onTimeChange={(time) => updateTime("end", time)}
            />
          </div>
        ) : null}
      </div>
    </>
  );
}
