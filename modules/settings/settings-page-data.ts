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
  readActiveShiftPatternFromSupabase,
  readFamilyNameFromSupabase,
  readOwnPushSubscriptionExistsFromSupabase,
} from "@/modules/family/api/members";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { getFamilyRepositoryFailure } from "@/modules/family/api/_common";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import { readAccessTokenClaims } from "@/modules/auth/access-token-claims";
import { readAuthUserMetadata } from "@/modules/auth/api/auth-user-metadata";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";
import { ANNUAL_LEAVE_HOURS_PER_DAY, calculateAnnualLeaveBalance } from "@/modules/leave/annual-leave";
import { parseAnnualLeaveSettings } from "@/modules/leave/annual-leave-settings";
import { DEFAULT_SHIFT_PATTERN_V1 } from "@/modules/shift";
import {
  readCachedSettingsPageData,
  writeCachedSettingsPageData,
} from "@/modules/settings/settings-page-cache";

export interface SettingsPageData {
  isConnected: boolean;
  profileName: string;
  profileEmail: string;
  profileRoleLabel: string;
  selfWorking: boolean;
  canCreateInvite: boolean;
  familyName: string;
  shiftPatternLabel: string;
  shiftPatternSeedDate: string;
  hasPushSubscription: boolean;
  annualLeave: AnnualLeaveSettingsPageData;
}

export interface AnnualLeaveSettingsPageData {
  year: number;
  totalDays: number;
  remainingDays: number;
  remainingHours: number;
  remainingLabel: string;
}

function formatPatternLabel(patternId: string, version: string): string {
  return `${patternId} v${version}`;
}

function createDisconnectedData(): SettingsPageData {
  const year = new Date().getFullYear();
  return {
    isConnected: false,
    profileName: "나",
    profileEmail: "로그인 정보 없음",
    profileRoleLabel: "멤버",
    selfWorking: true,
    canCreateInvite: false,
    familyName: "가족 정보 없음",
    shiftPatternLabel: formatPatternLabel(
      DEFAULT_SHIFT_PATTERN_V1.patternId,
      DEFAULT_SHIFT_PATTERN_V1.version,
    ),
    shiftPatternSeedDate: DEFAULT_SHIFT_PATTERN_V1.seedDate,
    hasPushSubscription: false,
    annualLeave: {
      year,
      totalDays: 0,
      remainingDays: 0,
      remainingHours: 0,
      remainingLabel: "0개",
    },
  };
}

async function readAnnualLeaveMetadata(
  userId: string,
  accessToken: string,
): Promise<Record<string, unknown>> {
  const config = resolveSupabaseAdminAuthConfig();
  if (config) {
    try {
      return await readAuthUserMetadata(config, userId);
    } catch {
      // Fall back to JWT metadata so settings still render when Admin API is unavailable.
    }
  }

  const claims = readAccessTokenClaims(accessToken);
  return claims?.userMetadata ?? {};
}

function buildAnnualLeaveData(
  metadata: Record<string, unknown>,
): AnnualLeaveSettingsPageData {
  const fallbackYear = new Date().getFullYear();
  const settings = parseAnnualLeaveSettings(metadata, fallbackYear);
  const balance = calculateAnnualLeaveBalance({
    totalDays: settings.totalHours / ANNUAL_LEAVE_HOURS_PER_DAY,
    usedHoursBeforeApp: settings.usedHoursBeforeApp,
    appUsages: [],
  });

  return {
    year: settings.year,
    totalDays: Math.floor(settings.totalHours / ANNUAL_LEAVE_HOURS_PER_DAY),
    remainingDays: balance.remainingDays,
    remainingHours: balance.remainingExtraHours,
    remainingLabel: balance.remainingLabel,
  };
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
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

  const nowMs = Date.now();
  const cacheKey = `${auth.familyId}:${auth.userId}`;
  const cached = readCachedSettingsPageData(cacheKey, nowMs);
  if (cached) {
    return cached;
  }

  try {
    const [profile, familyName, activePattern, hasPushSubscription, members, leaveMetadata] =
      await Promise.all([
        readAuthProfileFromSupabase(auth),
        readFamilyNameFromSupabase(auth),
        readActiveShiftPatternFromSupabase(auth),
        readOwnPushSubscriptionExistsFromSupabase(auth),
        listFamilyMembersFromSupabase(auth),
        readAnnualLeaveMetadata(auth.userId, auth.accessToken),
      ]);

    const self = members.find((member) => member.userId === auth.userId);
    const familyMasterUserId = pickFamilyMasterUserId(members);
    const resolvedPattern = activePattern ?? {
      patternId: DEFAULT_SHIFT_PATTERN_V1.patternId,
      version: DEFAULT_SHIFT_PATTERN_V1.version,
      seedDate: DEFAULT_SHIFT_PATTERN_V1.seedDate,
    };

    const data: SettingsPageData = {
      isConnected: true,
      profileName: profile.displayName ?? "나",
      profileEmail: profile.email ?? "이메일 정보 없음",
      profileRoleLabel: self
        ? getFamilyAppRoleLabel(resolveFamilyAppRole(self, familyMasterUserId))
        : "가족원",
      selfWorking: self?.working ?? true,
      canCreateInvite: self?.role === "admin",
      familyName: familyName ?? "이름 없는 가족",
      shiftPatternLabel: formatPatternLabel(
        resolvedPattern.patternId,
        resolvedPattern.version,
      ),
      shiftPatternSeedDate: resolvedPattern.seedDate,
      hasPushSubscription,
      annualLeave: buildAnnualLeaveData(leaveMetadata),
    };
    writeCachedSettingsPageData(cacheKey, data, nowMs);
    return data;
  } catch (error) {
    const failure = getFamilyRepositoryFailure(error);
    if (failure) {
      return createDisconnectedData();
    }

    throw error;
  }
}
