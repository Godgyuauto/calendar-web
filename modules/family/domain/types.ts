import type { OverrideType, ShiftCode, ShiftOverride } from "@/modules/shift";

export interface FamilyEvent {
  id: string;
  familyId: string;
  title: string;
  startTime: string;
  endTime: string;
  isRoutine: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CreateFamilyEventInput {
  familyId?: string;
  title: string;
  startTime: string;
  endTime: string;
  isRoutine?: boolean;
  createdBy?: string;
}

export interface UpdateFamilyEventInput {
  id: string;
  familyId?: string;
  title?: string;
  startTime?: string;
  endTime?: string;
  isRoutine?: boolean;
}

export interface CreateShiftOverrideInput {
  familyId?: string;
  userId?: string;
  date: string;
  overrideType: OverrideType;
  overrideShift: ShiftCode | null;
  label: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}

export type FamilyShiftOverride = ShiftOverride & { familyId: string };

export interface FamilyStoreState {
  events: FamilyEvent[];
  overrides: FamilyShiftOverride[];
}
