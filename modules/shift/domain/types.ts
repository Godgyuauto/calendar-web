export type ShiftCode = "A" | "B" | "C" | "OFF";

export type OverrideType =
  | "vacation"
  | "training"
  | "swap"
  | "extra"
  | "sick"
  | "business"
  | "custom";

export interface ShiftPatternConfig {
  patternId: string;
  version: string;
  seedDate: string;
  shiftCycle: ShiftCode[];
}

export interface ShiftOverride {
  id?: string;
  userId?: string;
  createdBy?: string | null;
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
  createdAt?: string;
}

export interface DayShiftSummary {
  date: string;
  baseShift: ShiftCode;
  finalShift: ShiftCode;
  override?: ShiftOverride;
}
