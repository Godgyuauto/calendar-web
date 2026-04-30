import Link from "next/link";
import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import { normalizeDateKey, parseViewMode } from "@/modules/calendar-ui/calendar-url-state";
import { CalendarPageClient } from "@/modules/calendar-ui/CalendarPageClient";
import { getHomePageData } from "@/modules/home/home-page-data";
import { getSeoulMonth, getSeoulYear, toSeoulDateKey } from "@/modules/home/utils/date";
import { BellIcon, CalendarIcon, NavBar, TabShell } from "@/modules/ui/components";

function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

type QueryValue = string | string[] | undefined;
type SearchParamsInput = Record<string, QueryValue>;

interface CalendarMonthPageProps {
  searchParams?: Promise<SearchParamsInput>;
}

function getQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseCalendarMonth(params: SearchParamsInput, fallbackDate: Date): Date {
  const yearParam = getQueryValue(params.year);
  const monthParam = getQueryValue(params.month);
  const year = Number(yearParam);
  const month = Number(monthParam);

  if (
    Number.isInteger(year) &&
    Number.isInteger(month) &&
    year >= 1970 &&
    year <= 9999 &&
    month >= 1 &&
    month <= 12
  ) {
    // Keep month selection in UTC to avoid timezone boundary drift.
    return new Date(Date.UTC(year, month - 1, 1, 12));
  }

  return new Date(
    Date.UTC(getSeoulYear(fallbackDate), getSeoulMonth(fallbackDate) - 1, 1, 12),
  );
}

// Month-calendar tab entry. Server-renders the grid from the shared home data
// loader; delegates segment/FAB/sheet state to the client wrapper.
export default async function CalendarMonthPage({
  searchParams,
}: CalendarMonthPageProps) {
  await ensureAuthenticatedOrRedirect("/");

  const now = new Date();
  const resolvedSearchParams = (await searchParams) ?? {};
  const monthDate = parseCalendarMonth(resolvedSearchParams, now);
  const selectedDateKey = normalizeDateKey(getQueryValue(resolvedSearchParams.add));
  const focusedDateKey = normalizeDateKey(getQueryValue(resolvedSearchParams.day));
  const initialView = parseViewMode(getQueryValue(resolvedSearchParams.view));
  const data = await getHomePageData(monthDate);
  const todayKey = toSeoulDateKey(now);

  return (
    <TabShell>
      <NavBar
        title="내 일정"
        left={
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center"
            aria-label="오버뷰로 이동"
          >
            <CalendarIcon size={20} />
          </Link>
        }
        right={
          <Link
            href="/settings"
            className="flex h-10 w-10 items-center justify-center"
            aria-label="알림 설정으로 이동"
          >
            <BellIcon size={20} />
          </Link>
        }
      />
      <CalendarPageClient
        key={`${data.currentYear}-${data.currentMonth}-${selectedDateKey ?? "none"}`}
        monthLabel={formatMonthLabel(data.currentYear, data.currentMonth)}
        activeYear={data.currentYear}
        activeMonth={data.currentMonth}
        todayKey={todayKey}
        calendarCells={data.calendarCells}
        monthOverrides={data.monthOverrides}
        initialView={initialView}
        initialFocusedDateKey={focusedDateKey}
        initialSelectedDateKey={selectedDateKey}
      />
    </TabShell>
  );
}
