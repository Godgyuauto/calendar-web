import { ensureAuthenticatedOrRedirect } from "@/modules/auth/server-session";
import { CalendarPageClient } from "@/modules/calendar-ui/CalendarPageClient";
import { getHomePageData } from "@/modules/home/home-page-data";
import { getSeoulMonth, getSeoulYear, toSeoulDateKey } from "@/modules/home/utils/date";
import { BellIcon, CalendarIcon, NavBar, TabShell } from "@/modules/ui/components";

function formatMonthLabel(year: number, month: number): string {
  return `${year}년 ${month}월`;
}

type QueryValue = string | string[] | undefined;
type SearchParamsInput = Record<string, QueryValue>;
const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface CalendarMonthPageProps {
  searchParams?: Promise<SearchParamsInput>;
}

function getQueryValue(value: QueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeDateKey(rawDate: string | undefined): string | undefined {
  if (!rawDate || !DATE_KEY_PATTERN.test(rawDate)) {
    return undefined;
  }

  const [year, month, day] = rawDate.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() + 1 !== month ||
    parsed.getUTCDate() !== day
  ) {
    return undefined;
  }

  return rawDate;
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
  const data = await getHomePageData(monthDate);
  const todayKey = toSeoulDateKey(now);

  return (
    <TabShell>
      <NavBar title="내 일정" left={<CalendarIcon size={20} />} right={<BellIcon size={20} />} />
      <CalendarPageClient
        key={`${data.currentYear}-${data.currentMonth}-${selectedDateKey ?? "none"}`}
        monthLabel={formatMonthLabel(data.currentYear, data.currentMonth)}
        activeYear={data.currentYear}
        activeMonth={data.currentMonth}
        todayKey={todayKey}
        calendarCells={data.calendarCells}
        initialSelectedDateKey={selectedDateKey}
      />
    </TabShell>
  );
}
