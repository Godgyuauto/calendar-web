import type { UpcomingScheduleItem } from "@/modules/home/upcoming-schedule";
import { toKoreanDateTime, toKoreanDateWithWeekday } from "@/modules/home/utils/date";
import { SectionLabel } from "@/modules/ui/components";

interface UpcomingEventsListProps {
  events: UpcomingScheduleItem[];
}

function formatEventTime(event: UpcomingScheduleItem): string {
  if (event.allDay) {
    return toKoreanDateWithWeekday(event.startTime);
  }

  return toKoreanDateTime(event.startTime);
}

// Card list of family events and calendar overrides in the next week.
// Left: blue time/date badge, right: title + optional memo line.
export function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  return (
    <section aria-label="다가오는 일정" className="px-5 pt-2">
      <SectionLabel className="px-0">다가오는 일정</SectionLabel>
      {events.length === 0 ? (
        <div className="rounded-[14px] bg-white px-4 py-5 text-center text-[13px] text-[#8e8e93]">
          예정된 일정이 없습니다
        </div>
      ) : (
        <ul className="overflow-hidden rounded-[14px] bg-white">
          {events.map((event, i) => (
            <li
              key={event.id}
              className={`flex items-center gap-3 px-4 py-3 ${
                i < events.length - 1 ? "border-b border-[#f5f5f5]" : ""
              }`}
            >
              <span className="rounded-[10px] bg-[#eaf2ff] px-2.5 py-1 text-[11px] font-semibold text-[#007AFF]">
                {formatEventTime(event)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] text-[#1a1a1a]">{event.title}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
