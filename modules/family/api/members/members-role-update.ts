import type { FamilyMemberDbRole } from "./family-members-role-repository";

interface UpdateMembersBody {
  targetUserId?: unknown;
  role?: unknown;
}

export interface RoleUpdateInput {
  targetUserId: string;
  role: FamilyMemberDbRole;
}

function parseRole(value: unknown): FamilyMemberDbRole | null {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "head" || normalized === "family_head" || normalized === "admin") {
    return "admin";
  }
  if (normalized === "member" || normalized === "family_member" || normalized === "editor") {
    return "editor";
  }
  return null;
}

export function parseRoleUpdate(
  body: UpdateMembersBody,
): RoleUpdateInput | null {
  const rawTargetUserId = body.targetUserId;
  const rawRole = body.role;
  if (rawTargetUserId === undefined && rawRole === undefined) {
    return null;
  }
  if (typeof rawTargetUserId !== "string" || rawTargetUserId.trim().length === 0) {
    return null;
  }
  const role = parseRole(rawRole);
  if (!role) {
    return null;
  }
  return { targetUserId: rawTargetUserId.trim(), role };
}
