import type { FamilyAuthContext } from "@/modules/family/api/auth-context";
import {
  FamilyRepositoryError,
  assertSupabaseResponseOk,
  buildSupabaseHeaders,
  buildSupabaseUrl,
  readJsonArray,
} from "@/modules/family/api/family-supabase-common";

export type FamilyMemberRole = "admin" | "editor";

interface FamilyMemberRow {
  id: string;
  user_id: string;
  role: FamilyMemberRole;
  created_at: string;
  working?: boolean | null;
}

interface FamilyRow {
  name: string;
}

interface ShiftPatternRow {
  pattern_id: string;
  version: string;
  seed_date: string;
}

interface PushSubscriptionRow {
  id: string;
}

export interface FamilyMemberReadModel {
  id: string;
  userId: string;
  role: FamilyMemberRole;
  createdAt: string;
  working: boolean;
}


export interface ShiftPatternReadModel {
  patternId: string;
  version: string;
  seedDate: string;
}

function pickString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}


export async function listFamilyMembersFromSupabase(
  auth: FamilyAuthContext,
): Promise<FamilyMemberReadModel[]> {
  const baseQuery = {
    family_id: `eq.${auth.familyId}`,
    order: "created_at.asc",
  };

  const request = async (select: string): Promise<FamilyMemberRow[]> => {
    const query = new URLSearchParams({
      select,
      ...baseQuery,
    }).toString();

    const response = await fetch(buildSupabaseUrl(`/rest/v1/family_members?${query}`), {
      method: "GET",
      headers: buildSupabaseHeaders(auth),
      cache: "no-store",
    });
    await assertSupabaseResponseOk(response, "Failed to list family members.");
    return readJsonArray<FamilyMemberRow>(response);
  };

  let rows: FamilyMemberRow[];
  try {
    rows = await request("id,user_id,role,created_at,working");
  } catch (error) {
    // Backward compatibility: environments that have not applied the migration
    // yet do not have family_members.working. Keep read path available.
    const needsLegacyFallback =
      error instanceof FamilyRepositoryError &&
      error.status === 400 &&
      /working/i.test(error.message);
    if (!needsLegacyFallback) {
      throw error;
    }
    rows = await request("id,user_id,role,created_at");
  }

  return rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    role: row.role,
    createdAt: row.created_at,
    working: row.working !== false,
  }));
}

export async function readFamilyNameFromSupabase(
  auth: FamilyAuthContext,
): Promise<string | null> {
  const query = new URLSearchParams({
    select: "name",
    id: `eq.${auth.familyId}`,
    limit: "1",
  }).toString();

  const response = await fetch(buildSupabaseUrl(`/rest/v1/families?${query}`), {
    method: "GET",
    headers: buildSupabaseHeaders(auth),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to read family name.");
  const rows = await readJsonArray<FamilyRow>(response);
  return pickString(rows[0]?.name);
}

export async function readActiveShiftPatternFromSupabase(
  auth: FamilyAuthContext,
): Promise<ShiftPatternReadModel | null> {
  const query = new URLSearchParams({
    select: "pattern_id,version,seed_date",
    family_id: `eq.${auth.familyId}`,
    is_active: "eq.true",
    order: "created_at.desc",
    limit: "1",
  }).toString();

  const response = await fetch(buildSupabaseUrl(`/rest/v1/shift_patterns?${query}`), {
    method: "GET",
    headers: buildSupabaseHeaders(auth),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to read shift pattern.");
  const rows = await readJsonArray<ShiftPatternRow>(response);
  const first = rows[0];
  if (!first) {
    return null;
  }

  return {
    patternId: first.pattern_id,
    version: first.version,
    seedDate: first.seed_date,
  };
}

export async function readOwnPushSubscriptionExistsFromSupabase(
  auth: FamilyAuthContext,
): Promise<boolean> {
  const query = new URLSearchParams({
    select: "id",
    family_id: `eq.${auth.familyId}`,
    user_id: `eq.${auth.userId}`,
    limit: "1",
  }).toString();

  const response = await fetch(buildSupabaseUrl(`/rest/v1/push_subscriptions?${query}`), {
    method: "GET",
    headers: buildSupabaseHeaders(auth),
    cache: "no-store",
  });
  await assertSupabaseResponseOk(response, "Failed to read push subscription status.");
  const rows = await readJsonArray<PushSubscriptionRow>(response);
  return rows.length > 0;
}
