import {
  getFamilyAppRoleLabel,
  pickFamilyMasterUserId,
  resolveFamilyAppRole,
} from "@/modules/family/api/members/family-member-role";
import type { FamilyMemberReadModel } from "@/modules/family/api/members/family-members-settings-supabase";
import { DEFAULT_SHIFT_PATTERN_V1, resolveDayShift, type ShiftOverride } from "@/modules/shift";
import type { ShiftPaletteKey } from "@/modules/ui/tokens";
import { isSystemMemberProfile } from "./member-visibility";

const AVATAR_COLORS = ["#007AFF", "#ff9500", "#34c759", "#af52de", "#ff2d55", "#8e8e93"];

export interface MemberAuthProfile {
  userId: string;
  email: string | null;
  displayName: string | null;
}

export interface MemberRow {
  id: string;
  name: string;
  roleLabel: string;
  avatarColor: string;
  working: boolean;
  todayShift?: ShiftPaletteKey;
  weekShifts?: ShiftPaletteKey[];
}

interface BuildMemberRowsInput {
  members: FamilyMemberReadModel[];
  profiles: Map<string, MemberAuthProfile>;
  familyId: string;
  selfUserId: string;
  selfDisplayName: string | null;
  todayKey: string;
  weekDateKeys: string[];
  overrides: ShiftOverride[];
}

function getAvatarColor(userId: string): string {
  const hash = userId
    .split("")
    .reduce((acc, char) => (acc + char.charCodeAt(0)) % AVATAR_COLORS.length, 0);
  return AVATAR_COLORS[hash];
}

function getEmailPrefix(email: string | null): string | null {
  const prefix = email?.split("@")[0]?.trim();
  return prefix ? prefix : null;
}

function getMemberDisplayName(
  userId: string,
  selfUserId: string,
  selfDisplayName: string | null,
  profile: MemberAuthProfile | undefined,
): string {
  if (userId === selfUserId) {
    return selfDisplayName ?? profile?.displayName ?? getEmailPrefix(profile?.email ?? null) ?? "나";
  }

  return profile?.displayName ?? getEmailPrefix(profile?.email ?? null) ?? `멤버 ${userId.slice(0, 6)}`;
}

export function buildMemberRows({
  members,
  profiles,
  familyId,
  selfUserId,
  selfDisplayName,
  todayKey,
  weekDateKeys,
  overrides,
}: BuildMemberRowsInput): MemberRow[] {
  const familyMasterUserId = pickFamilyMasterUserId(members);
  return members
    .filter((member) => {
      const profile = profiles.get(member.userId);
      return (
        member.userId !== familyId &&
        (member.userId === selfUserId || !!profile) &&
        !isSystemMemberProfile(profile)
      );
    })
    .map((member) => {
      const roleLabel = getFamilyAppRoleLabel(resolveFamilyAppRole(member, familyMasterUserId));
      const base = {
        id: member.id,
        name: getMemberDisplayName(
          member.userId,
          selfUserId,
          selfDisplayName,
          profiles.get(member.userId),
        ),
        roleLabel,
        avatarColor: getAvatarColor(member.userId),
        working: member.working,
      };

      if (!member.working) {
        return base;
      }

      const memberOverrides = overrides.filter((override) => override.userId === member.userId);
      return {
        ...base,
        todayShift: resolveDayShift(todayKey, {
          pattern: DEFAULT_SHIFT_PATTERN_V1,
          overrides: memberOverrides,
        }).finalShift,
        weekShifts: weekDateKeys.map(
          (dateKey) =>
            resolveDayShift(dateKey, {
              pattern: DEFAULT_SHIFT_PATTERN_V1,
              overrides: memberOverrides,
            }).finalShift,
        ),
      };
    });
}
