import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/_common";
import {
  getFamilyAppRoleLabel,
  pickFamilyMasterUserId,
  resolveFamilyAppRole,
} from "@/modules/family/api/members";
import {
  listFamilyMembersFromSupabase,
} from "@/modules/family/api/members";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { listShiftOverridesFromSupabase } from "@/modules/family/api/overrides";
import { getFamilyRepositoryFailure } from "@/modules/family/api/_common";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { toSeoulDateKey } from "@/modules/home/utils/date";
import {
  readCachedMembersPageData,
  writeCachedMembersPageData,
} from "@/modules/members/members-page-cache";
import { DEFAULT_SHIFT_PATTERN_V1, resolveDayShift, type ShiftOverride } from "@/modules/shift";
import type { ShiftPaletteKey } from "@/modules/ui/tokens";

const AVATAR_COLORS = ["#007AFF", "#ff9500", "#34c759", "#af52de", "#ff2d55", "#8e8e93"];

export interface MemberRow {
  id: string;
  name: string;
  roleLabel: string;
  avatarColor: string;
  working: boolean;
  todayShift?: ShiftPaletteKey;
  weekShifts?: ShiftPaletteKey[];
}

export interface MembersPageData {
  members: MemberRow[];
  isConnected: boolean;
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

function getAvatarColor(userId: string): string {
  const hash = userId
    .split("")
    .reduce((acc, char) => (acc + char.charCodeAt(0)) % AVATAR_COLORS.length, 0);
  return AVATAR_COLORS[hash];
}

function getMemberDisplayName(
  userId: string,
  selfUserId: string,
  selfDisplayName: string | null,
): string {
  if (userId === selfUserId) {
    return selfDisplayName ?? "나";
  }

  return `멤버 ${userId.slice(0, 6)}`;
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
    return { members: [], isConnected: false };
  }

  let auth: Awaited<ReturnType<typeof resolveFamilyAuthContextFromToken>>;
  try {
    auth = await resolveFamilyAuthContextFromToken(accessToken);
  } catch (error) {
    const failure = getApiAuthFailure(error);
    if (failure) {
      return { members: [], isConnected: false };
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
    const familyMasterUserId = pickFamilyMasterUserId(members);

    const rows: MemberRow[] = members.map((member) => {
      const working = member.working;
      const roleLabel = getFamilyAppRoleLabel(
        resolveFamilyAppRole(member, familyMasterUserId),
      );
      if (!working) {
        return {
          id: member.id,
          name: getMemberDisplayName(member.userId, auth.userId, profile.displayName),
          roleLabel,
          avatarColor: getAvatarColor(member.userId),
          working,
        };
      }

      const memberOverrides = overrides.filter((override) => override.userId === member.userId);
      const todayShift = resolveDayShift(todayKey, {
        pattern: DEFAULT_SHIFT_PATTERN_V1,
        overrides: memberOverrides,
      }).finalShift;
      const weekShifts = weekDateKeys.map(
        (dateKey) =>
          resolveDayShift(dateKey, {
            pattern: DEFAULT_SHIFT_PATTERN_V1,
            overrides: memberOverrides,
          }).finalShift,
      );

      return {
        id: member.id,
        name: getMemberDisplayName(member.userId, auth.userId, profile.displayName),
        roleLabel,
        avatarColor: getAvatarColor(member.userId),
        working,
        todayShift,
        weekShifts,
      };
    });

    const data: MembersPageData = { members: rows, isConnected: true };
    writeCachedMembersPageData(cacheKey, data, nowMs);
    return data;
  } catch (error) {
    const failure = getFamilyRepositoryFailure(error);
    if (failure) {
      return { members: [], isConnected: false };
    }

    throw error;
  }
}
