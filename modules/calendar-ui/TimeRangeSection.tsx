"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StructuredOverrideFormState } from "@/modules/calendar-ui/structured-override";
import {
  Chip,
  SectionLabel,
  TextField,
} from "@/modules/ui/components";

interface TimeRangeSectionProps {
  form: StructuredOverrideFormState;
  setForm: Dispatch<SetStateAction<StructuredOverrideFormState>>;
}

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

  return (
    <>
      <SectionLabel className="px-0">시간 (선택)</SectionLabel>
      <div className="space-y-2">
        <div className="flex gap-1.5">
          <Chip
            active={!hasTime}
            onClick={() =>
              setForm((current) => ({
                ...current,
                endDate: current.startDate,
                startAt: "",
                endAt: "",
              }))
            }
            variant="segment"
          >
            종일
          </Chip>
          <Chip
            active={hasTime}
            onClick={() =>
              setForm((current) => ({
                ...current,
                startAt: current.startAt || "09:00",
                endAt: current.endAt || "18:00",
              }))
            }
            variant="segment"
          >
            시간 지정
          </Chip>
        </div>

        {hasTime ? (
          <>
            <div className="grid grid-cols-[36px_minmax(124px,1fr)_132px] items-center gap-2">
              <span className="text-[12px] font-semibold text-[#8e8e93]">시작</span>
              <TextField
                type="date"
                value={form.startDate}
                className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startDate: event.target.value,
                    endDate: getEndDateAfterStartDateChange(current, event.target.value),
                  }))
                }
              />
              <TextField
                type="time"
                value={form.startAt}
                placeholder="09:00"
                className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                onChange={(event) =>
                  setForm((current) => ({ ...current, startAt: event.target.value }))
                }
              />
            </div>
            <div className="grid grid-cols-[36px_minmax(124px,1fr)_132px] items-center gap-2">
              <span className="text-[12px] font-semibold text-[#8e8e93]">종료</span>
              <TextField
                type="date"
                value={form.endDate}
                className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                onChange={(event) =>
                  setForm((current) => ({ ...current, endDate: event.target.value }))
                }
              />
              <TextField
                type="time"
                value={form.endAt}
                placeholder="18:00"
                className="min-w-0 px-2 text-center text-[13px] tabular-nums"
                onChange={(event) =>
                  setForm((current) => ({ ...current, endAt: event.target.value }))
                }
              />
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
