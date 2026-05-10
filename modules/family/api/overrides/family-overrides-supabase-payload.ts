import type { CreateShiftOverrideInput } from "@/modules/family";
import type { ShiftOverride } from "@/modules/shift";
import type { FamilyAuthContext } from "../_common/auth-context";

export const SHIFT_OVERRIDE_SELECT =
  "id,user_id,created_by,date,override_type,override_shift,label,start_time,end_time,note,created_at";

export interface ShiftOverrideRow {
  id: string;
  user_id: string;
  created_by: string | null;
  date: string;
  override_type: ShiftOverride["overrideType"];
  override_shift: ShiftOverride["overrideShift"];
  label: string;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string;
}

export function toShiftOverride(row: ShiftOverrideRow): ShiftOverride {
  return {
    id: row.id,
    userId: row.user_id,
    createdBy: row.created_by ?? row.user_id,
    date: row.date,
    overrideType: row.override_type,
    overrideShift: row.override_shift,
    label: row.label,
    startTime: row.start_time,
    endTime: row.end_time,
    note: row.note,
    createdAt: row.created_at,
  };
}

export function buildShiftOverrideInsertPayload(
  auth: FamilyAuthContext,
  input: CreateShiftOverrideInput,
) {
  return {
    family_id: auth.familyId,
    user_id: input.userId ?? auth.userId,
    created_by: auth.userId,
    date: input.date,
    override_type: input.overrideType,
    override_shift: input.overrideShift,
    label: input.label.trim(),
    start_time: input.startTime ?? null,
    end_time: input.endTime ?? null,
    note: input.note ?? null,
  };
}

export function buildShiftOverrideUpdatePayload(input: CreateShiftOverrideInput) {
  const payload: {
    user_id?: string;
    date: string;
    override_type: CreateShiftOverrideInput["overrideType"];
    override_shift: CreateShiftOverrideInput["overrideShift"];
    label: string;
    start_time: string | null;
    end_time: string | null;
    note: string | null;
  } = {
    date: input.date,
    override_type: input.overrideType,
    override_shift: input.overrideShift,
    label: input.label.trim(),
    start_time: input.startTime ?? null,
    end_time: input.endTime ?? null,
    note: input.note ?? null,
  };
  if (input.userId) {
    payload.user_id = input.userId;
  }
  return payload;
}

export function buildShiftOverrideMutationQuery(
  auth: FamilyAuthContext,
  id: string,
  input: {
    select: string;
  },
) {
  return new URLSearchParams({
    id: `eq.${id}`,
    family_id: `eq.${auth.familyId}`,
    select: input.select,
  });
}
