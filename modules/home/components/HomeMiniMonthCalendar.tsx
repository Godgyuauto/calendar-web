import type { CalendarCell } from "@/modules/calendar";

interface HomeMiniMonthCalendarProps {
  cells: CalendarCell[];
  todayKey: string;
}

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function getDayTextColor(weekday: number, muted: boolean): string {
  if (muted) {
    return "text-[#c7c7cc]";
  }
  if (weekday === 0) {
    return "text-[#ff3b30]";
  }
  if (weekday === 6) {
    return "text-[#007AFF]";
  }
  return "text-[#1a1a1a]";
}

// Home mini-calendar focuses on "date + event dot" readability.
// Shift chips stay in the full month calendar tab to keep this compact.
export function HomeMiniMonthCalendar({
  cells,
  todayKey,
}: HomeMiniMonthCalendarProps) {
  return (
    <div className="px-3 pb-2">
      <div className="grid grid-cols-7 pb-1">
        {WEEKDAY_HEADERS.map((weekday, index) => (
          <div
            key={weekday}
            className={`text-center text-[11px] font-semibold ${getDayTextColor(index, false)}`}
          >
            {weekday}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((cell) => {
          const isToday = cell.date === todayKey;
          const hasEvent = cell.isCurrentMonth && Boolean(cell.shift?.override);
          const dayTextColor = isToday
            ? "text-white"
            : getDayTextColor(cell.weekday, !cell.isCurrentMonth);
          return (
            <div
              key={cell.date}
              className="relative flex h-8 items-center justify-center text-[13px]"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full ${
                  isToday ? "bg-[#007AFF] font-semibold" : dayTextColor
                }`}
              >
                {cell.day}
              </span>
              {hasEvent ? (
                <span
                  aria-label="일정 있음"
                  className="absolute bottom-0 h-1.5 w-1.5 rounded-full bg-[#007AFF]"
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
