import type { CreateShiftOverrideInput } from "@/modules/family";
import type { FamilyAuthContext } from "@/modules/family/api/auth-context";
import {
  assertSupabaseResponseOk,
  buildSupabaseHeaders,
  buildSupabaseUrl,
  FamilyRepositoryError,
  readJsonArray,
} from "@/modules/family/api/family-supabase-common";
import { isISODateKey } from "@/modules/family/domain/validators";
import type { ShiftOverride } from "@/modules/shift";

interface ShiftOverrideRow {
  id: string;
  user_id: string;
  date: string;
  override_type: ShiftOverride["overrideType"];
  override_shift: ShiftOverride["overrideShift"];
  label: string;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  created_at: string;
}

function toShiftOverride(row: ShiftOverrideRow): ShiftOverride {
  return {
    id: row.id,
    userId: row.user_id,
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

export async function listShiftOverridesFromSupabase(
  auth: FamilyAuthContext,
  input?: { year?: number; month?: number },
): Promise<ShiftOverride[]> {
  const query = new URLSearchParams({
    select: "id,user_id,date,override_type,override_shift,label,start_time,end_time,note,created_at",
    family_id: `eq.${auth.familyId}`,
    order: "date.asc",
  });
  if (input?.year && input?.month) {
    const start = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
    const last = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate();
    const end = `${input.year}-${String(input.month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    query.set("date", `gte.${start}`);
    query.append("date", `lte.${end}`);
  }

  const response = await fetch(buildSupabaseUrl(`/rest/v1/shift_overrides?${query.toString()}`), {
    method: "GET",
    headers: buildSupabaseHeaders(auth),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to list shift overrides.");
  const rows = await readJsonArray<ShiftOverrideRow>(response);
  return rows.map(toShiftOverride);
}

export async function createShiftOverrideInSupabase(
  auth: FamilyAuthContext,
  input: CreateShiftOverrideInput,
): Promise<ShiftOverride> {
  if (!isISODateKey(input.date)) {
    throw new FamilyRepositoryError("date must be in YYYY-MM-DD format.", 400);
  }

  const response = await fetch(buildSupabaseUrl("/rest/v1/shift_overrides"), {
    method: "POST",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    body: JSON.stringify({
      family_id: auth.familyId,
      user_id: auth.userId,
      date: input.date,
      override_type: input.overrideType,
      override_shift: input.overrideShift,
      label: input.label.trim(),
      start_time: input.startTime ?? null,
      end_time: input.endTime ?? null,
      note: input.note ?? null,
    }),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to create shift override.");
  const rows = await readJsonArray<ShiftOverrideRow>(response);
  if (rows.length === 0) {
    throw new FamilyRepositoryError("Failed to create shift override.", 503);
  }

  return toShiftOverride(rows[0]);
}

export async function removeShiftOverrideInSupabase(
  auth: FamilyAuthContext,
  id: string,
): Promise<boolean> {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    family_id: `eq.${auth.familyId}`,
    select: "id",
  });
  const response = await fetch(buildSupabaseUrl(`/rest/v1/shift_overrides?${query.toString()}`), {
    method: "DELETE",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to delete shift override.");
  const rows = await readJsonArray<{ id: string }>(response);
  return rows.length > 0;
}
