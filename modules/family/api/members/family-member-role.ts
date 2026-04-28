export type FamilyMemberDbRole = "admin" | "editor";
export type FamilyMemberAppRole = "master" | "head" | "member";

export interface FamilyMemberRoleInput {
  userId: string;
  role: FamilyMemberDbRole;
  createdAt: string;
}

function toCreatedAtUnix(value: string): number {
  const unix = new Date(value).getTime();
  return Number.isNaN(unix) ? Number.MAX_SAFE_INTEGER : unix;
}

export function pickFamilyMasterUserId(
  members: FamilyMemberRoleInput[],
): string | null {
  const admins = members
    .filter((member) => member.role === "admin")
    .slice()
    .sort((left, right) => {
      const byCreatedAt = toCreatedAtUnix(left.createdAt) - toCreatedAtUnix(right.createdAt);
      if (byCreatedAt !== 0) {
        return byCreatedAt;
      }
      return left.userId.localeCompare(right.userId);
    });
  return admins[0]?.userId ?? null;
}

export function resolveFamilyAppRole(
  member: Pick<FamilyMemberRoleInput, "userId" | "role">,
  familyMasterUserId: string | null,
): FamilyMemberAppRole {
  if (member.role === "editor") {
    return "member";
  }
  return member.userId === familyMasterUserId ? "master" : "head";
}

export function getFamilyAppRoleLabel(role: FamilyMemberAppRole): string {
  switch (role) {
    case "master":
      return "가족마스터";
    case "head":
      return "가족장";
    default:
      return "가족원";
  }
}

