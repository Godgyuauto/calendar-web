import type { OverrideType, ShiftCode } from "@/modules/shift";
import type { LeaveDeductionLabel } from "@/modules/leave/annual-leave-deduction";
import type {
  OverrideSubjectType,
  StructuredLeaveTarget,
} from "@/modules/family/domain/structured-override-note-types";

export interface OverrideRecordLike {
  date: string;
  userId?: string;
  createdBy?: string | null;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export interface EventTypeOption {
  id: OverrideType;
  emoji: string;
  label: string;
}

export interface StructuredOverrideFormState {
  eventType: OverrideType;
  shiftChange: ShiftCode | "KEEP";
  subjectType?: OverrideSubjectType;
  subjectUserId?: string | null;
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  remindAt: string;
  title: string;
  memo: string;
  leaveDeductionHours?: number;
  leaveDeductionLabel?: LeaveDeductionLabel;
  leaveExemptFromDeduction?: boolean;
  leaveTargets?: StructuredLeaveTarget[];
}

export interface OverrideSubmitPayload {
  userId?: string;
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime: string | null;
  endTime: string | null;
  note: string;
}

export interface StructuredOverrideDisplay {
  title: string;
  eventType: OverrideType;
  shiftChange: ShiftCode | "KEEP";
  allDay: boolean;
  startAt: string | null;
  endAt: string | null;
  remindAt: string | null;
  memo: string;
  subjectType?: OverrideSubjectType;
  subjectUserId?: string | null;
  leaveDeductionHours?: number | null;
  leaveDeductionLabel?: LeaveDeductionLabel | null;
  leaveExemptFromDeduction?: boolean;
}
