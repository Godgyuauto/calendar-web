import { getApiAuthFailure, getFamilyRepositoryFailure, resolveFamilyAuthContextFromToken } from "@/modules/family/api/_common";
import { listFamilyMembersFromSupabase } from "@/modules/family/api/members";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { listShiftOverridesFromSupabase } from "@/modules/family/api/overrides";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { toSeoulDateKey } from "@/modules/home/utils/date";
import {
  readCachedMembersPageData,
  writeCachedMembersPageData,
} from "@/modules/members/members-page-cache";
import { readMemberAuthProfiles } from "./members-page-auth-profiles";
import { buildMemberRows, type MemberRow } from "./members-page-row-builder";
import type { ShiftOverride } from "@/modules/shift";

export type { MemberRow } from "./members-page-row-builder";

export interface MembersPageData {
  members: MemberRow[];
  isConnected: boolean;
  profileName: string;
  profileEmail: string;
}

function createDisconnectedData(): MembersPageData {
  return { members: [], isConnected: false, profileName: "나", profileEmail: "로그인 정보 없음" };
}

function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map((unit) => Number(unit));
  return new Date(Date.UTC(year, month - 1, day));
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey: string, delta: number): string {
  const date = parseDateKey(dateKey);
  date.setUTCDate(date.getUTCDate() + delta);
  return toDateKey(date);
}

function getWeekDateKeys(todayKey: string): string[] {
  const weekStartOffset = parseDateKey(todayKey).getUTCDay();
  const weekStartKey = addDays(todayKey, -weekStartOffset);
  return Array.from({ length: 7 }, (_, index) => addDays(weekStartKey, index));
}

async function listWeekOverrides(
  auth: Awaited<ReturnType<typeof resolveFamilyAuthContextFromToken>>,
  weekDateKeys: string[],
): Promise<ShiftOverride[]> {
  const targetMonths = Array.from(new Set(weekDateKeys.map((dateKey) => dateKey.slice(0, 7))));
  const monthly = await Promise.all(
    targetMonths.map((yearMonth) => {
      const [year, month] = yearMonth.split("-").map((unit) => Number(unit));
      return listShiftOverridesFromSupabase(auth, { year, month });
    }),
  );

  const merged = new Map<string, ShiftOverride>();
  for (const monthRows of monthly) {
    for (const row of monthRows) {
      const dedupeKey =
        row.id ??
        `${row.userId ?? "unknown"}:${row.date}:${row.overrideType}:${row.createdAt ?? ""}`;
      merged.set(dedupeKey, row);
    }
  }
  return Array.from(merged.values());
}

export async function getMembersPageData(now: Date = new Date()): Promise<MembersPageData> {
  const accessToken = await getServerAccessTokenFromCookies();
  if (!accessToken) {
    return createDisconnectedData();
  }

  let auth: Awaited<ReturnType<typeof resolveFamilyAuthContextFromToken>>;
  try {
    auth = await resolveFamilyAuthContextFromToken(accessToken);
  } catch (error) {
    const failure = getApiAuthFailure(error);
    if (failure) {
      return createDisconnectedData();
    }

    throw error;
  }

  const todayKey = toSeoulDateKey(now);
  const weekDateKeys = getWeekDateKeys(todayKey);
  const nowMs = Date.now();
  const cacheKey = `${auth.familyId}:${auth.userId}:${todayKey}`;
  const cached = readCachedMembersPageData(cacheKey, nowMs);
  if (cached) {
    return cached;
  }

  try {
    const [members, profile, overrides] = await Promise.all([
      listFamilyMembersFromSupabase(auth),
      readAuthProfileFromSupabase(auth),
      listWeekOverrides(auth, weekDateKeys),
    ]);
    const profiles = await readMemberAuthProfiles(members.map((member) => member.userId));
    const rows: MemberRow[] = buildMemberRows({
      members,
      profiles,
      selfUserId: auth.userId,
      selfDisplayName: profile.displayName,
      todayKey,
      weekDateKeys,
      overrides,
    });

    const data: MembersPageData = {
      members: rows,
      isConnected: true,
      profileName: profile.displayName ?? "나",
      profileEmail: profile.email ?? "이메일 정보 없음",
    };
    writeCachedMembersPageData(cacheKey, data, nowMs);
    return data;
  } catch (error) {
    const failure = getFamilyRepositoryFailure(error);
    if (failure) {
      return createDisconnectedData();
    }

    throw error;
  }
}
