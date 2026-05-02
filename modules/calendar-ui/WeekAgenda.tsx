"use client";

import type { CalendarCell } from "@/modules/calendar";
import type { ScheduleDetailItem } from "@/modules/calendar-ui/schedule-detail-types";
import type { ShiftOverride } from "@/modules/shift";
import { SHIFT_PALETTE } from "@/modules/ui/tokens";
import { ChevronLeftIcon, ChevronRightIcon } from "@/modules/ui/components";
import { buildWeekAgendaDays, offsetWeek } from "./week-agenda-items";

interface WeekAgendaProps {
  dateKey: string;
  todayKey: string;
  calendarCells: CalendarCell[];
  overrides: ShiftOverride[];
  onChangeDate: (dateKey: string) => void;
  onOpenDateSheet: (dateKey: string, overrideId?: string) => void;
  onOpenDetail: (event: ScheduleDetailItem) => void;
}

export function WeekAgenda({
  dateKey,
  todayKey,
  calendarCells,
  overrides,
  onChangeDate,
  onOpenDateSheet,
  onOpenDetail,
}: WeekAgendaProps) {
  const days = buildWeekAgendaDays({ dateKey, todayKey, calendarCells, overrides });

  return (
    <section aria-label="주간 일정" className="space-y-2 px-4 pb-24">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeDate(offsetWeek(dateKey, -1))}
          className="flex h-10 w-10 items-center justify-center text-[#8e8e93]"
          aria-label="이전 주"
        >
          <ChevronLeftIcon size={21} />
        </button>
        <p className="text-[13px] font-semibold text-[#8e8e93]">이번 주 일정</p>
        <button
          type="button"
          onClick={() => onChangeDate(offsetWeek(dateKey, 1))}
          className="flex h-10 w-10 items-center justify-center text-[#8e8e93]"
          aria-label="다음 주"
        >
          <ChevronRightIcon size={21} />
        </button>
      </div>

      {days.map((day) => {
        const palette = day.shift ? SHIFT_PALETTE[day.shift.finalShift] : undefined;
        const hasShiftChange =
          Boolean(day.shift?.override) && day.shift?.baseShift !== day.shift?.finalShift;
        return (
          <div
            key={day.dateKey}
            className={`rounded-[13px] border border-[#e5e5ea] bg-white px-3.5 py-3 ${
              day.isToday ? "ring-1 ring-[#007AFF]/35" : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => onOpenDateSheet(day.dateKey)}
                className="w-12 shrink-0 text-left"
              >
                <span className="block text-[11px] font-semibold text-[#8e8e93]">
                  {day.weekdayLabel}
                </span>
                <span className="block text-[20px] font-bold text-[#1a1a1a]">
                  {day.dayNumber}
                </span>
              </button>
              <div className="min-w-0 flex-1">
                {palette && day.shift ? (
                  <span
                    className={`mb-2 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      hasShiftChange ? "ring-1 ring-[#ff9500]/35" : ""
                    }`}
                    style={{
                      backgroundColor: hasShiftChange ? "#fff1dd" : palette.bg,
                      color: hasShiftChange ? "#b35a00" : palette.fg,
                    }}
                  >
                    {day.shift.finalShift}
                  </span>
                ) : null}
                <div className="space-y-1">
                  {day.items.length > 0 ? (
                    day.items.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => onOpenDetail(item.detail)}
                        className="block w-full truncate rounded-[8px] bg-[#f6f6f8] px-2.5 py-2 text-left text-[12px] font-semibold text-[#1a1a1a]"
                      >
                        {item.timeLabel} · {item.title}
                      </button>
                    ))
                  ) : (
                    <p className="py-2 text-[12px] text-[#c7c7cc]">일정 없음</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
