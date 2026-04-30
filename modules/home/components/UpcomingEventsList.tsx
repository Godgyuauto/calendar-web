import type { UpcomingScheduleItem } from "@/modules/home/upcoming-schedule";
import { UpcomingEventsClient } from "@/modules/home/components/UpcomingEventsClient";
import { SectionLabel } from "@/modules/ui/components";

interface UpcomingEventsListProps {
  events: UpcomingScheduleItem[];
}

// Card list of family events and calendar overrides in the next week.
export function UpcomingEventsList({ events }: UpcomingEventsListProps) {
  return (
    <section aria-label="다가오는 일정" className="px-5 pt-2">
      <SectionLabel className="px-0">다가오는 일정</SectionLabel>
      <UpcomingEventsClient events={events} />
    </section>
  );
}
