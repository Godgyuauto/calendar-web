import type { CreateShiftOverrideInput } from "@/modules/family";
import type { FamilyAuthContext } from "../_common/auth-context";
import {
  assertSupabaseResponseOk,
  buildSupabaseHeaders,
  buildSupabaseUrl,
  FamilyRepositoryError,
  readJsonArray,
} from "../_common/family-supabase-common";
import { isISODateKey } from "@/modules/family/domain/validators";
import type { ShiftOverride } from "@/modules/shift";
import {
  buildShiftOverrideInsertPayload,
  buildShiftOverrideMutationQuery,
  buildShiftOverrideUpdatePayload,
  SHIFT_OVERRIDE_SELECT,
  type ShiftOverrideRow,
  toShiftOverride,
} from "./family-overrides-supabase-payload";

export async function listShiftOverridesFromSupabase(
  auth: FamilyAuthContext,
  input?: {
    year?: number;
    month?: number;
    startDateGte?: string;
    startDateLt?: string;
    scope?: "family" | "mine";
  },
): Promise<ShiftOverride[]> {
  const query = new URLSearchParams({
    select: SHIFT_OVERRIDE_SELECT,
    family_id: `eq.${auth.familyId}`,
    order: "date.asc",
  });
  if (input?.scope === "mine") {
    query.set("user_id", `eq.${auth.userId}`);
  }
  if (input?.year && input?.month) {
    const start = `${input.year}-${String(input.month).padStart(2, "0")}-01`;
    const last = new Date(Date.UTC(input.year, input.month, 0)).getUTCDate();
    const end = `${input.year}-${String(input.month).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
    query.set("date", `gte.${start}`);
    query.append("date", `lte.${end}`);
  }
  if (input?.startDateGte) {
    query.set("date", `gte.${input.startDateGte}`);
  }
  if (input?.startDateLt) {
    query.append("date", `lt.${input.startDateLt}`);
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

interface UpdateShiftOverrideInput extends CreateShiftOverrideInput {
  id: string;
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
    body: JSON.stringify(buildShiftOverrideInsertPayload(auth, input)),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to create shift override.");
  const rows = await readJsonArray<ShiftOverrideRow>(response);
  if (rows.length === 0) {
    throw new FamilyRepositoryError("Failed to create shift override.", 503);
  }

  return toShiftOverride(rows[0]);
}

export async function updateShiftOverrideInSupabase(
  auth: FamilyAuthContext,
  input: UpdateShiftOverrideInput,
): Promise<ShiftOverride | null> {
  if (!isISODateKey(input.date)) {
    throw new FamilyRepositoryError("date must be in YYYY-MM-DD format.", 400);
  }

  const query = buildShiftOverrideMutationQuery(auth, input.id, {
    select: SHIFT_OVERRIDE_SELECT,
  });

  const response = await fetch(buildSupabaseUrl(`/rest/v1/shift_overrides?${query.toString()}`), {
    method: "PATCH",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    body: JSON.stringify(buildShiftOverrideUpdatePayload(input)),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to update shift override.");
  const rows = await readJsonArray<ShiftOverrideRow>(response);
  if (rows.length === 0) {
    return null;
  }

  return toShiftOverride(rows[0]);
}

export async function removeShiftOverrideInSupabase(
  auth: FamilyAuthContext,
  id: string,
): Promise<boolean> {
  const query = buildShiftOverrideMutationQuery(auth, id, {
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
