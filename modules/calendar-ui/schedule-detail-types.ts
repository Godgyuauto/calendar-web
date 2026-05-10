import type { ShiftChange } from "@/modules/family/domain/structured-override-note";
import type { OverrideSubjectType } from "@/modules/family/domain/structured-override-note-types";
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
  subjectType?: OverrideSubjectType;
  subjectUserId?: string | null;
  createdBy?: string | null;
  subjectColor?: string;
  source: "event" | "override";
}
