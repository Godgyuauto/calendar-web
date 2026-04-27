import Link from "next/link";
import type { CalendarCell } from "@/modules/calendar";
import { getMonthGridOverrideLabel } from "@/modules/calendar-ui/structured-override";
import { SHIFT_PALETTE } from "@/modules/ui/tokens";

interface MonthGridProps {
  cells: CalendarCell[];
  todayKey: string;
  activeYear: number;
  activeMonth: number;
  selectedDateKey?: string;
}

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function weekdayColor(weekday: number, muted: boolean): string {
  if (muted) return "text-[#c7c7cc]";
  if (weekday === 0) return "text-[#ff3b30]";
  if (weekday === 6) return "text-[#007AFF]";
  return "text-[#1a1a1a]";
}

function buildDayTapHref(year: number, month: number, dateKey: string): string {
  const params = new URLSearchParams({
    year: String(year),
    month: String(month),
    add: dateKey,
  });
  return `/calendar?${params.toString()}`;
}

// Server-rendered 6x7 month grid. Each cell is a day-tap link that encodes the
// selected date into `?add=YYYY-MM-DD`, and the client sheet reads it.
export function MonthGrid({
  cells,
  todayKey,
  activeYear,
  activeMonth,
  selectedDateKey,
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
          const isToday = cell.date === todayKey;
          const isSelected = selectedDateKey === cell.date;
          const palette = cell.shift ? SHIFT_PALETTE[cell.shift.finalShift] : undefined;
          const overrideLabel =
            cell.isCurrentMonth && cell.shift?.override?.label
              ? getMonthGridOverrideLabel(cell.shift.override)
              : "";
          const hasOverrideEvent = cell.isCurrentMonth && Boolean(cell.shift?.override);
          return (
            <Link
              key={cell.date}
              href={buildDayTapHref(activeYear, activeMonth, cell.date)}
              aria-label={`${cell.date} 일정 추가`}
              className="flex min-h-[82px] flex-col gap-1 border-b border-[#f1f2f6] px-1.5 py-1 text-left text-[12px]"
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
              {cell.shift && cell.isCurrentMonth && palette ? (
                <span
                  className="w-fit rounded-full px-2 py-0.5 text-[10px] font-semibold"
                  style={{ backgroundColor: palette.bg, color: palette.fg }}
                >
                  {cell.shift.finalShift}
                </span>
              ) : null}
              {overrideLabel ? (
                <span className="max-w-full truncate rounded-[6px] bg-[#fff4e5] px-1.5 py-0.5 text-[9px] font-semibold text-[#b35a00]">
                  {overrideLabel}
                </span>
              ) : null}
              {!overrideLabel && hasOverrideEvent ? (
                <span
                  aria-label="일정 있음"
                  className="mt-0.5 h-1.5 w-1.5 rounded-full bg-[#ff9500]"
                />
              ) : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
