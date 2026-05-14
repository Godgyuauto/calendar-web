"use client";

import { useState } from "react";
import {
  CLOCK_MINUTE_OPTIONS,
  commitClockMinuteDraft,
  normalizeClockMinuteDraft,
  toClockTimeParts,
  toClockTimeValue,
  type ClockTimeParts,
} from "@/modules/calendar-ui/clock-time-selection";
import {
  Chip,
  TextField,
} from "@/modules/ui/components";

interface ClockTimeSelectorProps {
  value: string;
  onChange: (value: string) => void;
  minuteInputLabel: string;
}

const HOUR_OPTIONS = Array.from({ length: 12 }, (_, index) => index + 1);

export function ClockTimeSelector({
  value,
  onChange,
  minuteInputLabel,
}: ClockTimeSelectorProps) {
  const timeParts = toClockTimeParts(value);
  const [minuteDraftState, setMinuteDraftState] = useState({
    sourceMinute: timeParts.minute,
    value: timeParts.minute,
  });
  const minuteDraft =
    minuteDraftState.sourceMinute === timeParts.minute
      ? minuteDraftState.value
      : timeParts.minute;

  const updateTime = (patch: Partial<ClockTimeParts>) => {
    const nextParts = { ...timeParts, ...patch };
    setMinuteDraftState({ sourceMinute: nextParts.minute, value: nextParts.minute });
    onChange(toClockTimeValue(nextParts));
  };

  const commitMinute = () => {
    const minute = commitClockMinuteDraft(minuteDraft);
    updateTime({ minute });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {(["AM", "PM"] as const).map((period) => (
          <Chip
            key={period}
            active={timeParts.period === period}
            onClick={() => updateTime({ period })}
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
            active={timeParts.hour12 === hour12}
            onClick={() => updateTime({ hour12 })}
            variant="segment"
            className="min-w-0"
          >
            {hour12}
          </Chip>
        ))}
      </div>

      <div className="grid grid-cols-6 gap-1.5">
        {CLOCK_MINUTE_OPTIONS.map((minute) => (
          <Chip
            key={minute}
            active={timeParts.minute === minute}
            onClick={() => updateTime({ minute })}
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
          value={minuteDraft}
          aria-label={minuteInputLabel}
          className="min-w-0 px-2 text-center text-[13px] tabular-nums"
          onChange={(event) =>
            setMinuteDraftState({
              sourceMinute: timeParts.minute,
              value: normalizeClockMinuteDraft(event.target.value),
            })
          }
          onBlur={commitMinute}
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
