import "server-only";
import { getServerAccessTokenFromCookies } from "@/modules/home/access-token";
import {
  getApiAuthFailure,
  resolveFamilyAuthContextFromToken,
} from "@/modules/family/api/_common";
import { listFamilyMembersFromSupabase } from "@/modules/family/api/members";
import { readAuthProfileFromSupabase } from "@/modules/family/api/settings";
import { readMemberAuthProfiles } from "@/modules/members/members-page-auth-profiles";
import { isSystemMemberProfile } from "@/modules/members/member-visibility";
import type { CalendarSubjectContext, CalendarSubjectMember } from "./calendar-subject-types";

const COLORS = ["#007AFF", "#ff2d55", "#34c759", "#ff9500", "#af52de", "#8e8e93"];

function getColor(userId: string): string {
  const index = userId.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % COLORS.length;
  return COLORS[index];
}

function getEmailPrefix(email: string | null): string | null {
  const prefix = email?.split("@")[0]?.trim();
  return prefix ? prefix : null;
}

export async function readCalendarSubjectContext(): Promise<CalendarSubjectContext | null> {
  const accessToken = await getServerAccessTokenFromCookies();
  if (!accessToken) {
    return null;
  }

  let auth: Awaited<ReturnType<typeof resolveFamilyAuthContextFromToken>>;
  try {
    auth = await resolveFamilyAuthContextFromToken(accessToken);
  } catch (error) {
    if (getApiAuthFailure(error)) {
      return null;
    }
    throw error;
  }

  const [members, selfProfile] = await Promise.all([
    listFamilyMembersFromSupabase(auth),
    readAuthProfileFromSupabase(auth),
  ]);
  const profiles = await readMemberAuthProfiles(members.map((member) => member.userId));
  const visibleMembers: CalendarSubjectMember[] = members
    .filter((member) => {
      const profile = profiles.get(member.userId);
      return (
        member.userId !== auth.familyId &&
        (member.userId === auth.userId || !!profile) &&
        !isSystemMemberProfile(profile)
      );
    })
    .map((member) => {
      const profile = profiles.get(member.userId);
      const name =
        member.userId === auth.userId
          ? selfProfile.displayName ?? profile?.displayName ?? getEmailPrefix(profile?.email ?? null) ?? "나"
          : profile?.displayName ?? getEmailPrefix(profile?.email ?? null) ?? "가족";
      return {
        userId: member.userId,
        name,
        working: member.working,
        color: getColor(member.userId),
        isSelf: member.userId === auth.userId,
      };
    });

  return {
    selfUserId: auth.userId,
    members: visibleMembers,
  };
}
