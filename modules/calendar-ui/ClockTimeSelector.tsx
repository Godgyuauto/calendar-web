"use client";

import { useState } from "react";
import {
  commitClockWallTimeDraft,
  normalizeClockTimeDraft,
  toClockTimeParts,
  toClockTimeValue,
  toClockWallTimeDraft,
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
  const [timeDraftState, setTimeDraftState] = useState({
    sourceValue: value,
    value: toClockWallTimeDraft(value),
  });
  const timeDraft =
    timeDraftState.sourceValue === value
      ? timeDraftState.value
      : toClockWallTimeDraft(value);

  const updateTime = (patch: Partial<ClockTimeParts>) => {
    const nextParts = { ...timeParts, ...patch };
    const nextValue = toClockTimeValue(nextParts);
    setTimeDraftState({ sourceValue: nextValue, value: toClockWallTimeDraft(nextValue) });
    onChange(nextValue);
  };

  const commitTime = () => {
    const nextValue = commitClockWallTimeDraft(timeDraft, timeParts.period, value);
    setTimeDraftState({ sourceValue: nextValue, value: toClockWallTimeDraft(nextValue) });
    onChange(nextValue);
  };

  return (
    <div className="space-y-2">
      <SegmentControl
        options={PERIOD_OPTIONS}
        value={timeParts.period}
        onChange={(period) => updateTime({ period })}
      />

      <div className="grid grid-cols-[54px_minmax(0,1fr)] items-center gap-2">
        <span className="text-[12px] font-semibold text-[#8e8e93]">시간</span>
        <TextField
          type="text"
          inputMode="text"
          value={timeDraft}
          aria-label={minuteInputLabel.replace("분", "시간")}
          placeholder="예: 7:37"
          className="min-w-0 px-2 text-center text-[15px] font-semibold tabular-nums"
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
      </div>
    </div>
  );
}
