import type { HomePageData } from "@/modules/home/home-page-data";
import { HomeGreeting } from "@/modules/home/components/HomeGreeting";
import { HomeMiniMonthCalendar } from "@/modules/home/components/HomeMiniMonthCalendar";
import { TodayShiftCard } from "@/modules/home/components/TodayShiftCard";
import { UpcomingEventsList } from "@/modules/home/components/UpcomingEventsList";

interface HomeDataSectionProps {
  homeDataPromise: Promise<HomePageData>;
}

function formatKoreanDateLabel(todayKey: string): string {
  const [y, m, d] = todayKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "long",
    timeZone: "Asia/Seoul",
  }).format(date);
}

export async function HomeGreetingDataSection({
  homeDataPromise,
}: HomeDataSectionProps) {
  const data = await homeDataPromise;

  return (
    <HomeGreeting
      name={data.displayName}
      dateLabel={formatKoreanDateLabel(data.todayKey)}
    />
  );
}

export async function HomeTodayShiftDataSection({
  homeDataPromise,
}: HomeDataSectionProps) {
  const data = await homeDataPromise;

  return <TodayShiftCard shift={data.todaySummary.finalShift} />;
}

export async function HomeMonthGridDataSection({
  homeDataPromise,
}: HomeDataSectionProps) {
  const data = await homeDataPromise;

  return (
    <HomeMiniMonthCalendar
      cells={data.calendarCells}
      todayKey={data.todayKey}
    />
  );
}

export async function UpcomingEventsDataSection({
  homeDataPromise,
}: HomeDataSectionProps) {
  const data = await homeDataPromise;

  return <UpcomingEventsList events={data.upcomingEvents} />;
}
