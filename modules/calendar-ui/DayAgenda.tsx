"use client";

import type { CalendarCell } from "@/modules/calendar";
import { buildDayAgendaItems } from "@/modules/calendar-ui/day-agenda-items";
import type { ShiftOverride } from "@/modules/shift";
import { SHIFT_PALETTE } from "@/modules/ui/tokens";
import { ChevronLeftIcon, ChevronRightIcon } from "@/modules/ui/components";

interface DayAgendaProps {
  dateKey: string;
  todayKey: string;
  calendarCells: CalendarCell[];
  overrides: ShiftOverride[];
  onChangeDate: (dateKey: string) => void;
  onOpenDateSheet: (dateKey: string) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function addDays(dateKey: string, offset: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + offset));
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function formatDateLabel(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return `${month}월 ${day}일 (${WEEKDAY_LABELS[date.getUTCDay()]})`;
}

export function DayAgenda({
  dateKey,
  todayKey,
  calendarCells,
  overrides,
  onChangeDate,
  onOpenDateSheet,
}: DayAgendaProps) {
  const cell = calendarCells.find((candidate) => candidate.date === dateKey);
  const shift = cell?.shift;
  const palette = shift ? SHIFT_PALETTE[shift.finalShift] : undefined;
  const items = buildDayAgendaItems(dateKey, overrides);
  const hasShiftChange = Boolean(shift?.override && shift.baseShift !== shift.finalShift);

  return (
    <section aria-label="일간 일정" className="px-4 pb-24">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onChangeDate(addDays(dateKey, -1))}
          className="flex h-10 w-10 items-center justify-center text-[#8e8e93]"
          aria-label="이전 날"
        >
          <ChevronLeftIcon size={21} />
        </button>
        <div className="text-center">
          <h3 className="text-[17px] font-bold text-[#1a1a1a]">{formatDateLabel(dateKey)}</h3>
          <p className="mt-0.5 text-[11px] text-[#8e8e93]">
            {dateKey === todayKey ? "오늘" : dateKey}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChangeDate(addDays(dateKey, 1))}
          className="flex h-10 w-10 items-center justify-center text-[#8e8e93]"
          aria-label="다음 날"
        >
          <ChevronRightIcon size={21} />
        </button>
      </div>

      {shift && palette ? (
        <div
          className={`mb-3 rounded-[14px] px-4 py-3 ${hasShiftChange ? "ring-1 ring-[#ff9500]/35" : ""}`}
          style={{ backgroundColor: hasShiftChange ? "#fff8ed" : palette.bg }}
        >
          <p className="text-[11px] font-semibold text-[#8e8e93]">근무</p>
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-[22px] font-bold" style={{ color: palette.fg }}>
              {shift.finalShift}
            </p>
            {hasShiftChange ? (
              <span className="rounded-full bg-[#fff1dd] px-2 py-1 text-[11px] font-semibold text-[#b35a00]">
                변경됨
              </span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="mb-2 flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[#8e8e93]">이 날 일정</p>
        <button
          type="button"
          onClick={() => onOpenDateSheet(dateKey)}
          className="text-[12px] font-semibold text-[#007AFF]"
        >
          추가/관리
        </button>
      </div>

      <div className="space-y-2">
        {items.length > 0 ? (
          items.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => onOpenDateSheet(dateKey)}
              className="w-full rounded-[13px] border border-[#e5e5ea] bg-white px-3.5 py-3 text-left active:bg-[#f7f8fb]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-[#1a1a1a]">{item.title}</p>
                  <p className="mt-1 text-[12px] text-[#8e8e93]">
                    {item.timeLabel} · {item.shiftLabel}
                  </p>
                  {item.memo ? (
                    <p className="mt-1 line-clamp-2 text-[12px] text-[#8e8e93]">
                      {item.memo}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 rounded-[6px] bg-[#fff2e8] px-2 py-0.5 text-[11px] font-semibold text-[#c05621]">
                  {item.typeLabel}
                </span>
              </div>
            </button>
          ))
        ) : (
          <div className="rounded-[13px] border border-dashed border-[#e5e5ea] bg-white px-4 py-8 text-center">
            <p className="text-[13px] text-[#8e8e93]">등록된 일정이 없습니다.</p>
          </div>
        )}
      </div>
    </section>
  );
}
