import type { ShiftChange } from "@/modules/family/domain/structured-override-note";
import type { OverrideType } from "@/modules/shift";

export interface ScheduleDetailItem {
  id: string;
  sourceId: string;
  title: string;
  dateKey: string;
  startTime: string;
  endTime: string | null;
  allDay: boolean;
  eventType: OverrideType | null;
  shiftChange: ShiftChange | null;
  memo: string;
  remindAt: string | null;
  source: "event" | "override";
}
