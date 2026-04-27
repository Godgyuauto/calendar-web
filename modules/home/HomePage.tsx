import {
  HomeHero,
  HomeSidebar,
  MonthCalendarSection,
  RoutineTimelineSection,
} from "@/modules/home/components";
import {
  DEFAULT_SHIFT_PATTERN_V1,
  getHomePageData,
} from "@/modules/home/home-page-data";

export default async function HomePage() {
  const data = await getHomePageData();

  return (
    <div className="flex flex-1 justify-center px-4 py-8 sm:px-6 lg:px-8">
      <main className="flex w-full max-w-6xl flex-col gap-6">
        <HomeHero
          seedDate={DEFAULT_SHIFT_PATTERN_V1.seedDate}
          version={DEFAULT_SHIFT_PATTERN_V1.version}
        />

        <section className="grid gap-4 lg:grid-cols-[1.7fr_1fr]">
          <div className="grid gap-4">
            <MonthCalendarSection
              currentYear={data.currentYear}
              currentMonth={data.currentMonth}
              todayKey={data.todayKey}
              calendarCells={data.calendarCells}
            />
            <RoutineTimelineSection routineEvents={data.routineEvents} />
          </div>
          <HomeSidebar
            todaySummary={data.todaySummary}
            upcomingEvents={data.upcomingEvents}
          />
        </section>
      </main>
    </div>
  );
}
