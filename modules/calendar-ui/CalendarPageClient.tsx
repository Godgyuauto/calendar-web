"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ShiftOverride } from "@/modules/shift";
import type { CalendarCell } from "@/modules/calendar";
import { AddEventSheet } from "@/modules/calendar-ui/AddEventSheet";
import {
  buildDayHref,
  buildMonthHref,
  buildWeekHref,
  offsetMonth,
  type ViewMode,
} from "@/modules/calendar-ui/calendar-url-state";
import { DayAgenda } from "@/modules/calendar-ui/DayAgenda";
import { MonthGrid } from "@/modules/calendar-ui/MonthGrid";
import { WeekAgenda } from "@/modules/calendar-ui/WeekAgenda";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SegmentControl,
} from "@/modules/ui/components";

interface CalendarPageClientProps {
  monthLabel: string;
  activeYear: number;
  activeMonth: number;
  todayKey: string;
  calendarCells: CalendarCell[];
  monthOverrides: ShiftOverride[];
  initialView: ViewMode;
  initialFocusedDateKey?: string;
  initialSelectedDateKey?: string;
}

export function CalendarPageClient({
  monthLabel,
  activeYear,
  activeMonth,
  todayKey,
  calendarCells,
  monthOverrides,
  initialView,
  initialFocusedDateKey,
  initialSelectedDateKey,
}: CalendarPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>(initialView);
  const [fabOpen, setFabOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialSelectedDateKey ?? null);
  const [selectedOverrideId, setSelectedOverrideId] = useState<string | null>(null);
  const [focusedDate, setFocusedDate] = useState(
    initialFocusedDateKey ?? initialSelectedDateKey ?? todayKey,
  );
  const selectedDateFromQuery = initialSelectedDateKey;
  const sheetDate = selectedDate ?? todayKey;
  const sheetOpen = fabOpen || selectedDate !== null;

  const prevMonth = offsetMonth(activeYear, activeMonth, -1);
  const nextMonth = offsetMonth(activeYear, activeMonth, 1);
  const prevMonthHref = buildMonthHref(
    pathname,
    new URLSearchParams(searchParams.toString()),
    prevMonth.year,
    prevMonth.month,
  );
  const nextMonthHref = buildMonthHref(
    pathname,
    new URLSearchParams(searchParams.toString()),
    nextMonth.year,
    nextMonth.month,
  );

  const closeSheet = () => {
    setFabOpen(false);
    setSelectedDate(null);
    setSelectedOverrideId(null);
    if (!selectedDateFromQuery) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.delete("add");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const changeFocusedDate = (dateKey: string) => {
    setFocusedDate(dateKey);
    const [year, month] = dateKey.split("-").map(Number);
    if (year !== activeYear || month !== activeMonth) {
      router.replace(
        buildDayHref(pathname, new URLSearchParams(searchParams.toString()), dateKey),
        { scroll: false },
      );
    }
  };
  const changeFocusedWeek = (dateKey: string) => {
    setFocusedDate(dateKey);
    const [year, month] = dateKey.split("-").map(Number);
    if (year !== activeYear || month !== activeMonth) {
      router.replace(
        buildWeekHref(pathname, new URLSearchParams(searchParams.toString()), dateKey),
        { scroll: false },
      );
    }
  };
  const openDateSheet = (dateKey: string, overrideId?: string) => {
    setFabOpen(false);
    setSelectedOverrideId(overrideId ?? null);
    setFocusedDate(dateKey);
    setSelectedDate(dateKey);
  };
  return (
    <>
      <div className="px-4 pb-3">
        <SegmentControl<ViewMode>
          value={view}
          onChange={setView}
          options={[
            { value: "month", label: "월" },
            { value: "week", label: "주" },
            { value: "day", label: "일" },
          ]}
        />
      </div>

      {view !== "day" ? (
        <div className="flex items-center justify-between px-5 pb-2">
          <Link href={prevMonthHref} aria-label="이전 달" className="text-[#8e8e93]">
            <ChevronLeftIcon size={22} />
          </Link>
          <h2 className="text-[17px] font-bold text-[#1a1a1a]">{monthLabel}</h2>
          <Link href={nextMonthHref} aria-label="다음 달" className="text-[#8e8e93]">
            <ChevronRightIcon size={22} />
          </Link>
        </div>
      ) : null}

      {view === "month" ? (
        <MonthGrid
          cells={calendarCells}
          monthOverrides={monthOverrides}
          todayKey={todayKey}
          selectedDateKey={selectedDate ?? undefined}
          onSelectDate={(dateKey) => {
            setFabOpen(false);
            setSelectedOverrideId(null);
            setFocusedDate(dateKey);
            setSelectedDate(dateKey);
          }}
        />
      ) : view === "day" ? (
        <DayAgenda
          dateKey={focusedDate}
          todayKey={todayKey}
          calendarCells={calendarCells}
          overrides={monthOverrides}
          onChangeDate={changeFocusedDate}
          onOpenDateSheet={openDateSheet}
        />
      ) : (
        <WeekAgenda
          dateKey={focusedDate}
          todayKey={todayKey}
          calendarCells={calendarCells}
          overrides={monthOverrides}
          onChangeDate={changeFocusedWeek}
          onOpenDateSheet={openDateSheet}
        />
      )}

      <button
        type="button"
        aria-label="일정 추가"
        onClick={() => {
          setSelectedDate(null);
          setSelectedOverrideId(null);
          setFabOpen(true);
        }}
        className="fixed bottom-20 right-5 z-20 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-[#007AFF] text-white shadow-[0_6px_18px_rgba(0,122,255,0.35)] active:scale-[0.98]"
      >
        <PlusIcon size={24} />
      </button>
      <AddEventSheet
        key={`${sheetDate}:${selectedOverrideId ?? "day"}:${sheetOpen ? "open" : "closed"}`}
        open={sheetOpen}
        onClose={closeSheet}
        onSaved={closeSheet}
        defaultDate={sheetDate}
        initialTab={selectedDate ? "existing" : "create"}
        selectedOverrideId={selectedOverrideId}
      />
    </>
  );
}
