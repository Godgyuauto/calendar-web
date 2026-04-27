import type { FamilyEvent } from "@/modules/family";
import { DayShiftSummary, SHIFT_COLORS, SHIFT_LABELS_KO } from "@/modules/shift";
import { toKoreanDateTime } from "@/modules/home/utils/date";
import { PushNotificationCard } from "@/modules/home/components/PushNotificationCard";

interface HomeSidebarProps {
  todaySummary: DayShiftSummary;
  upcomingEvents: FamilyEvent[];
}

export function HomeSidebar({ todaySummary, upcomingEvents }: HomeSidebarProps) {
  return (
    <div className="grid gap-4">
      <PushNotificationCard />

      <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-md shadow-slate-300/30">
        <p className="text-sm text-slate-500">오늘 근무조</p>
        <div className="mt-3 flex items-center gap-3">
          <span
            className="h-3 w-12 rounded-full"
            style={{ backgroundColor: SHIFT_COLORS[todaySummary.finalShift] }}
          />
          <strong className="text-lg text-slate-900">
            {SHIFT_LABELS_KO[todaySummary.finalShift]}
          </strong>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          기본값: {SHIFT_LABELS_KO[todaySummary.baseShift]}
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-md shadow-slate-300/30">
        <p className="text-sm text-slate-500">루틴 레이어</p>
        <p className="mt-3 rounded-xl bg-slate-100/80 px-3 py-3 text-sm text-slate-700">
          루틴 일정은 메인 달력을 가리지 않도록 하단 타임라인으로 분리해 표시합니다.
        </p>
      </article>

      <article className="rounded-3xl border border-slate-200/70 bg-white/85 p-5 shadow-md shadow-slate-300/30">
        <p className="text-sm text-slate-500">다가오는 가족 일정</p>
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {upcomingEvents.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2"
            >
              <p className="font-medium">{event.title}</p>
              <p className="mt-1 font-mono text-xs text-slate-500">
                {toKoreanDateTime(event.startTime)} ~ {toKoreanDateTime(event.endTime)}
              </p>
            </li>
          ))}
        </ul>
      </article>
    </div>
  );
}
