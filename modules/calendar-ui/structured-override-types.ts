import type { OverrideType, ShiftCode } from "@/modules/shift";

export interface OverrideRecordLike {
  date: string;
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
  startDate: string;
  endDate: string;
  startAt: string;
  endAt: string;
  remindAt: string;
  title: string;
  memo: string;
}

export interface OverrideSubmitPayload {
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
}
