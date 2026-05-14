import type { ShiftOverride } from "@/modules/shift";
import { parseStructuredOverrideNote } from "@/modules/family/domain/structured-override-note";
import { readAuthProfileFromSupabase } from "../settings/family-auth-profile-supabase";
import { listFamilyMembersFromSupabase } from "../members/family-members-settings-supabase";
import { readMemberAuthProfiles } from "@/modules/members/members-page-auth-profiles";
import type { FamilyAuthContext } from "../_common/auth-context";

export interface TelegramOverrideLabels {
  subjectLabel: string;
  actorLabel: string;
}

function getEmailPrefix(email: string | null): string | null {
  const prefix = email?.split("@")[0]?.trim();
  return prefix ? prefix : null;
}

export async function resolveTelegramOverrideLabels(
  auth: FamilyAuthContext,
  override: ShiftOverride,
  input?: { actorUserId?: string | null },
): Promise<TelegramOverrideLabels> {
  const structured = parseStructuredOverrideNote(override.note, {
    eventType: override.overrideType,
    shiftChange: override.overrideShift ?? "KEEP",
  });
  const subjectType = structured?.subject_type ?? "member";
  const subjectUserId = subjectType === "member"
    ? structured?.subject_user_id ?? override.userId ?? null
    : null;
  const actorUserId = input?.actorUserId ?? auth.userId;

  try {
    const [members, selfProfile] = await Promise.all([
      listFamilyMembersFromSupabase(auth),
      readAuthProfileFromSupabase(auth),
    ]);
    const profiles = await readMemberAuthProfiles(members.map((member) => member.userId));
    const subjectProfile = subjectUserId ? profiles.get(subjectUserId) : null;
    const actorProfile = profiles.get(actorUserId);
    const actorLabel =
      (actorUserId === auth.userId ? selfProfile.displayName : null) ??
      actorProfile?.displayName ??
      (actorUserId === auth.userId ? getEmailPrefix(selfProfile.email) : null) ??
      getEmailPrefix(actorProfile?.email ?? null) ??
      (actorUserId === auth.userId ? "나" : "가족");

    if (subjectType === "shared") {
      return { subjectLabel: "우리", actorLabel };
    }

    return {
      subjectLabel:
        subjectProfile?.displayName ??
        getEmailPrefix(subjectProfile?.email ?? null) ??
        "개인",
      actorLabel,
    };
  } catch {
    return {
      subjectLabel: subjectType === "shared" ? "우리" : "개인",
      actorLabel: "나",
    };
  }
}
