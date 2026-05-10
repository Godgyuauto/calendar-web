import type { LeaveDeductionLabel } from "@/modules/leave/annual-leave-deduction";
import type { OverrideType, ShiftCode } from "@/modules/shift";

export type ShiftChange = ShiftCode | "KEEP";
export type OverrideSubjectType = "member" | "shared";

export interface StructuredLeaveTarget {
  user_id: string;
  deduction_hours: number;
  deduction_label: LeaveDeductionLabel;
  exempt_from_deduction: boolean;
}

export interface StructuredOverrideNoteV1 {
  schema: "calendar_override_v1";
  event_type: OverrideType;
  shift_change: ShiftChange;
  all_day: boolean;
  start_at: string | null;
  end_at: string | null;
  remind_at: string | null;
  title: string;
  memo: string;
  leave_deduction_hours?: number | null;
  leave_deduction_label?: LeaveDeductionLabel | null;
  leave_exempt_from_deduction?: boolean;
  subject_type: OverrideSubjectType;
  subject_user_id: string | null;
  leave_targets: StructuredLeaveTarget[];
}
