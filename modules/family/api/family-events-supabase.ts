import type {
  CreateFamilyEventInput,
  FamilyEvent,
  UpdateFamilyEventInput,
} from "@/modules/family";
import type { FamilyAuthContext } from "@/modules/family/api/auth-context";
import {
  assertSupabaseResponseOk,
  buildSupabaseHeaders,
  buildSupabaseUrl,
  FamilyRepositoryError,
  readJsonArray,
} from "@/modules/family/api/family-supabase-common";
import { validateEventWindow } from "@/modules/family/domain/validators";

interface FamilyEventRow {
  id: string;
  family_id: string;
  title: string;
  start_time: string;
  end_time: string;
  is_routine: boolean;
  created_by: string;
  created_at: string;
}

function toFamilyEvent(row: FamilyEventRow): FamilyEvent {
  return {
    id: row.id,
    familyId: row.family_id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    isRoutine: row.is_routine,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

export async function listFamilyEventsFromSupabase(
  auth: FamilyAuthContext,
  input?: {
    isRoutine?: boolean;
    startTimeGte?: string;
    startTimeLt?: string;
    limit?: number;
  },
): Promise<FamilyEvent[]> {
  const query = new URLSearchParams({
    select: "id,family_id,title,start_time,end_time,is_routine,created_by,created_at",
    family_id: `eq.${auth.familyId}`,
    order: "start_time.asc",
  });
  if (typeof input?.isRoutine === "boolean") {
    query.set("is_routine", `eq.${input.isRoutine}`);
  }
  if (input?.startTimeGte) {
    query.set("start_time", `gte.${input.startTimeGte}`);
  }
  if (input?.startTimeLt) {
    query.append("start_time", `lt.${input.startTimeLt}`);
  }
  if (typeof input?.limit === "number" && Number.isFinite(input.limit) && input.limit > 0) {
    query.set("limit", String(Math.floor(input.limit)));
  }

  const response = await fetch(buildSupabaseUrl(`/rest/v1/family_events?${query.toString()}`), {
    method: "GET",
    headers: buildSupabaseHeaders(auth),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to list family events.");
  const rows = await readJsonArray<FamilyEventRow>(response);
  return rows.map(toFamilyEvent);
}

export async function createFamilyEventInSupabase(
  auth: FamilyAuthContext,
  input: CreateFamilyEventInput,
): Promise<FamilyEvent> {
  validateEventWindow(input.startTime, input.endTime);

  const response = await fetch(buildSupabaseUrl("/rest/v1/family_events"), {
    method: "POST",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    body: JSON.stringify({
      family_id: auth.familyId,
      title: input.title.trim(),
      start_time: input.startTime,
      end_time: input.endTime,
      is_routine: input.isRoutine ?? false,
      created_by: auth.userId,
    }),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to create family event.");
  const rows = await readJsonArray<FamilyEventRow>(response);
  if (rows.length === 0) {
    throw new FamilyRepositoryError("Failed to create family event.", 503);
  }

  return toFamilyEvent(rows[0]);
}

export async function updateFamilyEventInSupabase(
  auth: FamilyAuthContext,
  input: UpdateFamilyEventInput,
): Promise<FamilyEvent> {
  const nextPatch: Record<string, unknown> = {};
  if (typeof input.title === "string") nextPatch.title = input.title.trim();
  if (typeof input.startTime === "string") nextPatch.start_time = input.startTime;
  if (typeof input.endTime === "string") nextPatch.end_time = input.endTime;
  if (typeof input.isRoutine === "boolean") nextPatch.is_routine = input.isRoutine;
  if (typeof nextPatch.start_time === "string" && typeof nextPatch.end_time === "string") {
    validateEventWindow(nextPatch.start_time, nextPatch.end_time);
  }

  const query = new URLSearchParams({
    id: `eq.${input.id}`,
    family_id: `eq.${auth.familyId}`,
    select: "id,family_id,title,start_time,end_time,is_routine,created_by,created_at",
  });
  const response = await fetch(buildSupabaseUrl(`/rest/v1/family_events?${query.toString()}`), {
    method: "PATCH",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    body: JSON.stringify(nextPatch),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to update family event.");
  const rows = await readJsonArray<FamilyEventRow>(response);
  if (rows.length === 0) {
    throw new FamilyRepositoryError("Event not found.", 404);
  }

  return toFamilyEvent(rows[0]);
}

export async function removeFamilyEventInSupabase(
  auth: FamilyAuthContext,
  id: string,
): Promise<boolean> {
  const query = new URLSearchParams({
    id: `eq.${id}`,
    family_id: `eq.${auth.familyId}`,
    select: "id",
  });
  const response = await fetch(buildSupabaseUrl(`/rest/v1/family_events?${query.toString()}`), {
    method: "DELETE",
    headers: buildSupabaseHeaders(auth, "return=representation"),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to delete family event.");
  const rows = await readJsonArray<{ id: string }>(response);
  return rows.length > 0;
}
