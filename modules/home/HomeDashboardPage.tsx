import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { hasServerSession } from "@/modules/auth/server-session";
import {
  HomeGreetingDataSection,
  HomeAnnualLeaveDataSection,
  HomeMonthGridDataSection,
  HomeTodayShiftDataSection,
  UpcomingEventsDataSection,
} from "@/modules/home/components/HomeDashboardDataSections";
import {
  HomeGreetingSkeleton,
  HomeMonthGridSkeleton,
  HomeTodayShiftSkeleton,
  UpcomingEventsSkeleton,
} from "@/modules/home/components/HomeDashboardSkeletons";
import { getHomePageData } from "@/modules/home/home-page-data";
import { getSeoulMonth, getSeoulYear } from "@/modules/home/utils/date";
import { BellIcon, CalendarIcon, NavBar, TabShell } from "@/modules/ui/components";

// iOS-style home dashboard — the `/` route entry.
// Layout (top→bottom): NavBar, greeting, today-shift gradient card,
// monthly calendar bridge, upcoming events, TabBar.
export default async function HomeDashboardPage() {
  if (!(await hasServerSession())) {
    redirect("/login");
  }

  const now = new Date();
  const currentYear = getSeoulYear(now);
  const currentMonth = getSeoulMonth(now);
  const calendarHref = `/calendar?year=${currentYear}&month=${currentMonth}`;

  // Start one shared data read, then each Suspense boundary consumes the same promise.
  const homeDataPromise = getHomePageData(now);

  return (
    <TabShell>
      <NavBar
        title="내 일정"
        left={
          <Link
            href={calendarHref}
            className="flex h-10 w-10 items-center justify-center"
            aria-label="전체 캘린더로 이동"
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
      <div className="flex flex-col gap-5 pb-6">
        <Suspense fallback={<HomeGreetingSkeleton />}>
          <HomeGreetingDataSection homeDataPromise={homeDataPromise} />
        </Suspense>
        <Suspense fallback={<HomeTodayShiftSkeleton />}>
          <HomeTodayShiftDataSection homeDataPromise={homeDataPromise} />
        </Suspense>
        <Suspense fallback={null}>
          <HomeAnnualLeaveDataSection homeDataPromise={homeDataPromise} />
        </Suspense>
        <section className="mx-5 overflow-hidden rounded-[16px] border border-[#e5e5ea] bg-white pb-3 pt-3">
          <div className="mb-1 flex items-center justify-between px-3">
            <h2 className="text-[14px] font-semibold text-[#1a1a1a]">이번 달 캘린더</h2>
            <Link
              href={calendarHref}
              className="rounded-full bg-[#007AFF] px-3 py-1 text-[11px] font-semibold text-white"
            >
              전체 보기
            </Link>
          </div>
          <Suspense fallback={<HomeMonthGridSkeleton />}>
            <HomeMonthGridDataSection homeDataPromise={homeDataPromise} />
          </Suspense>
        </section>
        <Suspense fallback={<UpcomingEventsSkeleton />}>
          <UpcomingEventsDataSection homeDataPromise={homeDataPromise} />
        </Suspense>
      </div>
    </TabShell>
  );
}
