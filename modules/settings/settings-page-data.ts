import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/auth-context";
import {
  getFamilyAppRoleLabel,
  pickFamilyMasterUserId,
  resolveFamilyAppRole,
} from "@/modules/family/api/family-member-role";
import {
  listFamilyMembersFromSupabase,
  readActiveShiftPatternFromSupabase,
  readFamilyNameFromSupabase,
  readOwnPushSubscriptionExistsFromSupabase,
} from "@/modules/family/api/family-members-settings-supabase";
import { readAuthProfileFromSupabase } from "@/modules/family/api/family-auth-profile-supabase";
import { getFamilyRepositoryFailure } from "@/modules/family/api/family-supabase-common";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
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
  familyName: string;
  shiftPatternLabel: string;
  shiftPatternSeedDate: string;
  hasPushSubscription: boolean;
}

function formatPatternLabel(patternId: string, version: string): string {
  return `${patternId} v${version}`;
}

function createDisconnectedData(): SettingsPageData {
  return {
    isConnected: false,
    profileName: "나",
    profileEmail: "로그인 정보 없음",
    profileRoleLabel: "멤버",
    selfWorking: true,
    familyName: "가족 정보 없음",
    shiftPatternLabel: formatPatternLabel(
      DEFAULT_SHIFT_PATTERN_V1.patternId,
      DEFAULT_SHIFT_PATTERN_V1.version,
    ),
    shiftPatternSeedDate: DEFAULT_SHIFT_PATTERN_V1.seedDate,
    hasPushSubscription: false,
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
    const [profile, familyName, activePattern, hasPushSubscription, members] =
      await Promise.all([
        readAuthProfileFromSupabase(auth),
        readFamilyNameFromSupabase(auth),
        readActiveShiftPatternFromSupabase(auth),
        readOwnPushSubscriptionExistsFromSupabase(auth),
        listFamilyMembersFromSupabase(auth),
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
      familyName: familyName ?? "이름 없는 가족",
      shiftPatternLabel: formatPatternLabel(
        resolvedPattern.patternId,
        resolvedPattern.version,
      ),
      shiftPatternSeedDate: resolvedPattern.seedDate,
      hasPushSubscription,
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
