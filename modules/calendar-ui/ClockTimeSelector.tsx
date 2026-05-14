"use client";

import { useState } from "react";
import {
  CLOCK_MINUTE_OPTIONS,
  commitClockTimeDraft,
  normalizeClockTimeDraft,
  toClockTimeParts,
  toClockTimeValue,
  type ClockTimeParts,
} from "@/modules/calendar-ui/clock-time-selection";
import {
  SegmentControl,
  TextField,
} from "@/modules/ui/components";

interface ClockTimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  minuteInputLabel: string;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);
const PERIOD_OPTIONS = [
  { value: "AM", label: "오전" },
  { value: "PM", label: "오후" },
] as const;

export function ClockTimeSelector({
  value,
  onChange,
  minuteInputLabel,
}: ClockTimeSelectorProps) {
  const timeParts = toClockTimeParts(value);
  const minuteOptions = CLOCK_MINUTE_OPTIONS.includes(timeParts.minute)
    ? CLOCK_MINUTE_OPTIONS
    : [...CLOCK_MINUTE_OPTIONS, timeParts.minute].sort();
  const [timeDraftState, setTimeDraftState] = useState({
    sourceValue: value,
    value,
  });
  const timeDraft = timeDraftState.sourceValue === value ? timeDraftState.value : value;

  const updateTime = (patch: Partial<ClockTimeParts>) => {
    const nextParts = { ...timeParts, ...patch };
    const nextValue = toClockTimeValue(nextParts);
    setTimeDraftState({ sourceValue: nextValue, value: nextValue });
    onChange(nextValue);
  };

  const commitTime = () => {
    const nextValue = commitClockTimeDraft(timeDraft, value);
    setTimeDraftState({ sourceValue: nextValue, value: nextValue });
    onChange(nextValue);
  };

  return (
    <div className="space-y-2">
      <SegmentControl
        options={PERIOD_OPTIONS}
        value={timeParts.period}
        onChange={(period) => updateTime({ period })}
      />

      <div className="grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#8e8e93]">시</span>
          <select
            value={String(timeParts.hour12)}
            onChange={(event) => updateTime({ hour12: Number(event.target.value) })}
            className="h-[42px] w-full rounded-[10px] border-0 bg-[#f2f2f7] px-3 text-center text-sm font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          >
            {HOUR_OPTIONS.map((hour12) => (
              <option key={hour12} value={hour12}>
                {hour12}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[12px] font-semibold text-[#8e8e93]">분</span>
          <select
            value={timeParts.minute}
            onChange={(event) => updateTime({ minute: event.target.value })}
            className="h-[42px] w-full rounded-[10px] border-0 bg-[#f2f2f7] px-3 text-center text-sm font-semibold text-[#1a1a1a] focus:outline-none focus:ring-2 focus:ring-[#007AFF]"
          >
            {minuteOptions.map((minute) => (
              <option key={minute} value={minute}>
                {minute}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-[64px_minmax(0,1fr)_54px] items-end gap-2">
        <span className="pb-3 text-[12px] font-semibold text-[#8e8e93]">직접</span>
        <TextField
          type="text"
          inputMode="text"
          value={timeDraft}
          aria-label={minuteInputLabel.replace("분", "시간")}
          placeholder="예: 7:37, 0737"
          className="min-w-0 px-2 text-center text-[13px] tabular-nums"
          onChange={(event) =>
            setTimeDraftState({
              sourceValue: value,
              value: normalizeClockTimeDraft(event.target.value),
            })
          }
          onBlur={commitTime}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={commitTime}
          className="h-[42px] rounded-[10px] bg-[#007AFF] px-2 text-[13px] font-semibold text-white"
        >
          적용
        </button>
      </div>
    </div>
  );
}
