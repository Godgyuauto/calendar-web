"use client";

import { useState } from "react";
import {
  commitClockWallTimeDraft,
  normalizeClockTimeDraft,
  toClockTimeParts,
  toClockTimeValue,
  toClockWallTimeDraft,
  type ClockPeriod,
} from "@/modules/calendar-ui/clock-time-selection";

interface CompactDateTimeFieldProps {
  label: string;
  date: string;
  time: string;
  timeLabel: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
}

const PERIOD_OPTIONS: Array<{ value: ClockPeriod; label: string }> = [
  { value: "AM", label: "오전" },
  { value: "PM", label: "오후" },
];

function normalizeDateDraft(value: string): string {
  return value.replace(/[^\d-]/g, "").slice(0, 10);
}

export function CompactDateTimeField({
  label,
  date,
  time,
  timeLabel,
  onDateChange,
  onTimeChange,
}: CompactDateTimeFieldProps) {
  const timeParts = toClockTimeParts(time);
  const [timeDraftState, setTimeDraftState] = useState({
    sourceValue: time,
    value: toClockWallTimeDraft(time),
  });
  const timeDraft =
    timeDraftState.sourceValue === time
      ? timeDraftState.value
      : toClockWallTimeDraft(time);

  const commitTime = () => {
    const nextValue = commitClockWallTimeDraft(timeDraft, timeParts.period, time);
    setTimeDraftState({ sourceValue: nextValue, value: toClockWallTimeDraft(nextValue) });
    onTimeChange(nextValue);
  };

  return (
    <div className="grid grid-cols-[44px_minmax(0,1fr)] items-center gap-2 rounded-[10px] bg-[#f2f2f7] px-3 py-2">
      <span className="text-[12px] font-semibold text-[#8e8e93]">{label}</span>
      <div className="grid min-w-0 grid-cols-[minmax(94px,1fr)_66px_72px] gap-1.5">
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${label} 날짜 입력`}
          value={date}
          onChange={(event) => onDateChange(normalizeDateDraft(event.target.value))}
          className="h-9 min-w-0 rounded-[8px] bg-white px-2 text-center text-[13px] font-semibold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#007AFF]"
        />
        <select
          aria-label={`${label} 오전 오후 선택`}
          value={timeParts.period}
          onChange={(event) => {
            const period = event.target.value as ClockPeriod;
            const nextValue = toClockTimeValue({ ...timeParts, period });
            setTimeDraftState({
              sourceValue: nextValue,
              value: toClockWallTimeDraft(nextValue),
            });
            onTimeChange(nextValue);
          }}
          className="h-9 min-w-0 rounded-[8px] bg-white px-1 text-center text-[13px] font-semibold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#007AFF]"
        >
          {PERIOD_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          inputMode="text"
          aria-label={timeLabel}
          value={timeDraft}
          placeholder="7:30"
          onChange={(event) =>
            setTimeDraftState({
              sourceValue: time,
              value: normalizeClockTimeDraft(event.target.value),
            })
          }
          onBlur={() => commitTime()}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          className="h-9 min-w-0 rounded-[8px] bg-white px-2 text-center text-[13px] font-semibold text-[#1a1a1a] outline-none focus:ring-2 focus:ring-[#007AFF]"
        />
      </div>
    </div>
  );
}
