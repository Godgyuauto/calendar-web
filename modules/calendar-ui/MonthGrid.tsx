"use client";

import type { CalendarCell } from "@/modules/calendar";
import { buildMonthGridOverrideBadges } from "@/modules/calendar-ui/month-grid-overrides";
import type { ShiftOverride } from "@/modules/shift";
import { SHIFT_PALETTE } from "@/modules/ui/tokens";

interface MonthGridProps {
  cells: CalendarCell[];
  monthOverrides: ShiftOverride[];
  todayKey: string;
  selectedDateKey?: string;
  onSelectDate: (dateKey: string) => void;
}

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function weekdayColor(weekday: number, muted: boolean): string {
  if (muted) return "text-[#c7c7cc]";
  if (weekday === 0) return "text-[#ff3b30]";
  if (weekday === 6) return "text-[#007AFF]";
  return "text-[#1a1a1a]";
}

// 6x7 month grid. Day taps open the sheet locally, without waiting for a
// route transition or server component refresh.
export function MonthGrid({
  cells,
  monthOverrides,
  todayKey,
  selectedDateKey,
  onSelectDate,
}: MonthGridProps) {
  return (
    <section aria-label="월간 달력" className="px-4 pb-20">
      <div className="grid grid-cols-7 border-b border-[#ececf1] pb-2 pt-1">
        {WEEKDAY_HEADERS.map((label, i) => (
          <div
            key={label}
            className={`text-center text-[11px] font-semibold ${weekdayColor(i, false)}`}
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((cell) => {
          const shift = cell.shift;
          const isToday = cell.date === todayKey;
          const isSelected = selectedDateKey === cell.date;
          const palette = shift ? SHIFT_PALETTE[shift.finalShift] : undefined;
          const overrideBadges = cell.isCurrentMonth
            ? buildMonthGridOverrideBadges({
                cellDate: cell.date,
                primaryOverride: shift?.override,
                monthOverrides,
              })
            : null;
          const hasOverrideEvent = cell.isCurrentMonth && Boolean(shift?.override);
          const hasShiftChange =
            hasOverrideEvent &&
            Boolean(shift) &&
            shift?.baseShift !== shift?.finalShift;
          return (
            <button
              type="button"
              key={cell.date}
              onClick={() => onSelectDate(cell.date)}
              aria-label={`${cell.date} 일정 보기`}
              className={`flex min-h-[82px] touch-manipulation flex-col gap-1 border-b border-[#f1f2f6] px-1.5 py-1 text-left text-[12px] active:bg-[#f7f8fb] ${
                hasShiftChange ? "bg-[#fffaf2]" : ""
              }`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full text-[13px] ${
                  isToday
                    ? "bg-[#007AFF] font-semibold text-white"
                    : isSelected
                      ? "bg-[#e8f0fe] font-semibold text-[#007AFF]"
                    : weekdayColor(cell.weekday, !cell.isCurrentMonth)
                }`}
              >
                {cell.day}
              </span>
              {shift && cell.isCurrentMonth && palette ? (
                <span
                  className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    hasShiftChange ? "ring-1 ring-[#ff9500]/35" : ""
                  }`}
                  style={{
                    backgroundColor: hasShiftChange ? "#fff1dd" : palette.bg,
                    color: hasShiftChange ? "#b35a00" : palette.fg,
                  }}
                >
                  {shift.finalShift}
                </span>
              ) : null}
              {overrideBadges?.label ? (
                <span className="flex max-w-full items-center gap-1">
                  <span className="min-w-0 truncate rounded-[6px] bg-[#fff4e5] px-1.5 py-0.5 text-[9px] font-semibold text-[#b35a00]">
                    {overrideBadges.label}
                  </span>
                  {overrideBadges.additionalCount > 0 ? (
                    <span className="shrink-0 rounded-full bg-[#ff9500] px-1.5 py-0.5 text-[9px] font-bold text-white">
                      +{overrideBadges.additionalCount}
                    </span>
                  ) : null}
                </span>
              ) : null}
              {!overrideBadges?.label && hasOverrideEvent ? (
                <span
                  aria-label="일정 있음"
                  className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#ff9500]"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
