import { SHIFT_PALETTE, type ShiftPaletteKey } from "@/modules/ui/tokens";
import type { DayShiftSummary } from "@/modules/shift";

interface MiniWeekStripProps {
  monthRows: DayShiftSummary[];
  todayKey: string;
  // Days on which the current user has any event. Used to render a dot.
  eventDates?: Set<string>;
}

const WEEKDAY_KO = ["일", "월", "화", "수", "목", "금", "토"];

// Horizontal 7-day strip centered on today. Each tile shows a weekday label,
// day number, shift chip, and a blue dot for days with events.
export function MiniWeekStrip({
  monthRows,
  todayKey,
  eventDates,
}: MiniWeekStripProps) {
  const byDate = new Map(monthRows.map((row) => [row.date, row]));
  const today = new Date(`${todayKey}T00:00:00`);
  const offset = today.getUTCDay();
  const weekStart = new Date(today);
  weekStart.setUTCDate(today.getUTCDate() - offset);

  const days: { key: string; day: number; weekday: number; shift?: ShiftPaletteKey }[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(weekStart);
    d.setUTCDate(weekStart.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    const row = byDate.get(key);
    days.push({ key, day: d.getUTCDate(), weekday: i, shift: row?.finalShift });
  }

  return (
    <section aria-label="이번 주" className="px-5">
      <div className="flex justify-between gap-1">
        {days.map((d) => {
          const isToday = d.key === todayKey;
          const palette = d.shift ? SHIFT_PALETTE[d.shift] : undefined;
          return (
            <div
              key={d.key}
              className={`flex flex-1 flex-col items-center gap-1 rounded-[12px] py-2 ${
                isToday ? "bg-[#007AFF] text-white" : "bg-white text-[#1a1a1a]"
              }`}
            >
              <span
                className={`text-[10px] font-medium ${isToday ? "text-white/80" : "text-[#8e8e93]"}`}
              >
                {WEEKDAY_KO[d.weekday]}
              </span>
              <span className="text-[15px] font-semibold">{d.day}</span>
              {palette ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-semibold ${
                    isToday ? "bg-white/25 text-white" : ""
                  }`}
                  style={
                    isToday
                      ? undefined
                      : { backgroundColor: palette.bg, color: palette.fg }
                  }
                >
                  {d.shift}
                </span>
              ) : (
                <span className="text-[10px] text-transparent">·</span>
              )}
              <span
                className={`h-1 w-1 rounded-full ${
                  eventDates?.has(d.key)
                    ? isToday
                      ? "bg-white"
                      : "bg-[#007AFF]"
                    : "bg-transparent"
                }`}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
