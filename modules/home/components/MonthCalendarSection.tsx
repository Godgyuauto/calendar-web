import { CalendarCell } from "@/modules/calendar";
import { SHIFT_COLORS, SHIFT_LABELS_KO } from "@/modules/shift";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

interface MonthCalendarSectionProps {
  currentYear: number;
  currentMonth: number;
  todayKey: string;
  calendarCells: CalendarCell[];
}

export function MonthCalendarSection({
  currentYear,
  currentMonth,
  todayKey,
  calendarCells,
}: MonthCalendarSectionProps) {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-md shadow-slate-300/30 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          {currentYear}년 {currentMonth}월 교대표
        </h2>
        <p className="text-xs text-slate-500">A/B/C/휴무 색상바</p>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-500">
        {WEEKDAY_LABELS.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-2">
        {calendarCells.map((cell) => (
          <article
            key={cell.date}
            className={`min-h-[112px] rounded-2xl border p-2.5 ${
              cell.isCurrentMonth
                ? "border-slate-200 bg-slate-50/90"
                : "border-slate-100 bg-slate-100/50"
            } ${cell.date === todayKey ? "ring-2 ring-blue-300" : ""}`}
          >
            <p
              className={`font-mono text-xs ${
                cell.isCurrentMonth ? "text-slate-600" : "text-slate-400"
              }`}
            >
              {cell.day}일
            </p>

            {cell.shift ? (
              <>
                <div
                  className="mt-2 h-2 w-full rounded-full"
                  style={{ backgroundColor: SHIFT_COLORS[cell.shift.finalShift] }}
                />
                <p className="mt-2 text-[11px] font-medium text-slate-900">
                  {SHIFT_LABELS_KO[cell.shift.finalShift]}
                </p>
                {cell.shift.override ? (
                  <p className="mt-1 text-[11px] text-rose-600">
                    {cell.shift.override.label}
                  </p>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-[11px] text-slate-400">전월/익월</p>
            )}
          </article>
        ))}
      </div>
    </article>
  );
}
