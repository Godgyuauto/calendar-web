import { FamilyEvent } from "@/modules/family";
import { toKoreanDateTime } from "@/modules/home/utils/date";

interface RoutineTimelineSectionProps {
  routineEvents: FamilyEvent[];
}

export function RoutineTimelineSection({
  routineEvents,
}: RoutineTimelineSectionProps) {
  return (
    <article className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-md shadow-slate-300/30 sm:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h3 className="text-lg font-semibold text-slate-900">루틴 레이어 타임라인</h3>
        <p className="text-xs text-slate-500">메인 달력과 분리 표시</p>
      </div>

      {routineEvents.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
          이번 달 루틴 일정이 없습니다.
        </p>
      ) : (
        <ol className="space-y-3">
          {routineEvents.map((event) => (
            <li
              key={event.id}
              className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3"
            >
              <p className="text-sm font-semibold text-slate-900">{event.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                {toKoreanDateTime(event.startTime)} ~ {toKoreanDateTime(event.endTime)}
              </p>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
