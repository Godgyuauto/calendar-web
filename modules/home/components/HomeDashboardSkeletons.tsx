function SkeletonBlock({ className }: { className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`block animate-pulse rounded-xl bg-[#e5e5ea] ${className}`}
    />
  );
}

export function HomeGreetingSkeleton() {
  return (
    <header aria-label="홈 로딩" className="px-5 pb-2 pt-6">
      <SkeletonBlock className="h-8 w-48 rounded-lg" />
      <SkeletonBlock className="mt-2 h-4 w-36 rounded-md" />
    </header>
  );
}

export function HomeTodayShiftSkeleton() {
  return (
    <section
      aria-label="오늘 근무 로딩"
      className="mx-5 rounded-[18px] bg-[#f2f2f7] p-5"
    >
      <SkeletonBlock className="h-3 w-20 rounded-md" />
      <SkeletonBlock className="mt-3 h-8 w-28 rounded-lg" />
      <div className="mt-4 flex gap-2">
        <SkeletonBlock className="h-8 w-24 rounded-full" />
        <SkeletonBlock className="h-8 w-24 rounded-full" />
      </div>
    </section>
  );
}

export function HomeMonthGridSkeleton() {
  return (
    <div aria-label="월간 캘린더 로딩" className="px-3 pb-2">
      <div className="grid grid-cols-7 gap-1.5">
        {Array.from({ length: 14 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-16 w-full rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}

export function UpcomingEventsSkeleton() {
  return (
    <section aria-label="다가오는 일정 로딩" className="px-5 pt-2">
      <SkeletonBlock className="h-5 w-24 rounded-md" />
      <div className="mt-2 rounded-[14px] bg-white px-4 py-3">
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <SkeletonBlock className="h-6 w-20 rounded-[10px]" />
              <SkeletonBlock className="h-4 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
