"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AddEventSheet } from "@/modules/calendar-ui/AddEventSheet";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  SegmentControl,
} from "@/modules/ui/components";

type ViewMode = "month" | "week" | "day";

interface CalendarPageClientProps {
  monthLabel: string;
  activeYear: number;
  activeMonth: number;
  todayKey: string;
  children: React.ReactNode;
}

// Client wrapper around the server-rendered month grid.
// Owns: view-mode segment state, month navigation links, and AddEventSheet state.
// The sheet opens either from FAB (local state) or from `?add=YYYY-MM-DD` query.
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function offsetMonth(year: number, month: number, offset: number): { year: number; month: number } {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function buildMonthHref(
  pathname: string,
  baseParams: URLSearchParams,
  year: number,
  month: number,
): string {
  const params = new URLSearchParams(baseParams.toString());
  params.set("year", String(year));
  params.set("month", String(month));
  params.delete("add");
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

function normalizeDateKey(rawDate: string | null): string | null {
  if (!rawDate || !DATE_KEY_PATTERN.test(rawDate)) {
    return null;
  }

  const [year, month, day] = rawDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return rawDate;
}

export function CalendarPageClient({
  monthLabel,
  activeYear,
  activeMonth,
  todayKey,
  children,
}: CalendarPageClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [view, setView] = useState<ViewMode>("month");
  const [fabOpen, setFabOpen] = useState(false);
  const selectedDateFromQuery = normalizeDateKey(searchParams.get("add"));
  const sheetDate = selectedDateFromQuery ?? todayKey;
  // Query-driven open state lets day-tap deep-link into the sheet on refresh.
  const sheetOpen = fabOpen || selectedDateFromQuery !== null;

  const prevMonth = offsetMonth(activeYear, activeMonth, -1);
  const nextMonth = offsetMonth(activeYear, activeMonth, 1);
  const baseParams = new URLSearchParams(searchParams.toString());
  const prevMonthHref = buildMonthHref(
    pathname,
    baseParams,
    prevMonth.year,
    prevMonth.month,
  );
  const nextMonthHref = buildMonthHref(
    pathname,
    baseParams,
    nextMonth.year,
    nextMonth.month,
  );

  const closeSheet = () => {
    setFabOpen(false);
    if (!selectedDateFromQuery) {
      return;
    }

    // Remove only the day-tap marker so month context stays untouched.
    const params = new URLSearchParams(searchParams.toString());
    params.delete("add");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
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

      <div className="flex items-center justify-between px-5 pb-2">
        <Link href={prevMonthHref} aria-label="이전 달" className="text-[#8e8e93]">
          <ChevronLeftIcon size={22} />
        </Link>
        <h2 className="text-[17px] font-bold text-[#1a1a1a]">{monthLabel}</h2>
        <Link href={nextMonthHref} aria-label="다음 달" className="text-[#8e8e93]">
          <ChevronRightIcon size={22} />
        </Link>
      </div>

      {view === "month" ? (
        children
      ) : (
        <div className="mx-5 rounded-[14px] bg-white py-10 text-center text-[13px] text-[#8e8e93]">
          {view === "week" ? "주간" : "일간"} 뷰는 준비 중입니다.
        </div>
      )}

      <button
        type="button"
        aria-label="일정 추가"
        onClick={() => setFabOpen(true)}
        className="fixed bottom-20 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#007AFF] text-white shadow-[0_6px_18px_rgba(0,122,255,0.35)]"
      >
        <PlusIcon size={24} />
      </button>

      <AddEventSheet
        key={`${sheetDate}:${selectedDateFromQuery ? "existing" : "create"}:${sheetOpen ? "open" : "closed"}`}
        open={sheetOpen}
        onClose={closeSheet}
        onSaved={closeSheet}
        defaultDate={sheetDate}
        initialTab={selectedDateFromQuery ? "existing" : "create"}
      />
    </>
  );
}
