import "server-only";
import { resolveSupabaseAdminAuthConfig } from "@/modules/auth/api/supabase-auth";
import { parseDisplayName } from "@/modules/family/api/settings/auth-profile-metadata";
import type { MemberAuthProfile } from "./members-page-row-builder";

interface AdminUserRow {
  id?: string;
  email?: string;
  user_metadata?: unknown;
}

interface AdminUsersResponse {
  users?: AdminUserRow[];
}

export async function readMemberAuthProfiles(
  userIds: string[],
): Promise<Map<string, MemberAuthProfile>> {
  const config = resolveSupabaseAdminAuthConfig();
  if (!config || userIds.length === 0) {
    return new Map();
  }

  const wanted = new Set(userIds);
  const response = await fetch(`${config.url}/auth/v1/admin/users?page=1&per_page=1000`, {
    headers: {
      apikey: config.serviceRoleKey,
      Authorization: `Bearer ${config.serviceRoleKey}`,
    },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to read member auth profiles.");
  }

  const payload = (await response.json()) as AdminUsersResponse;
  const profiles = new Map<string, MemberAuthProfile>();
  for (const user of payload.users ?? []) {
    if (!user.id || !wanted.has(user.id)) {
      continue;
    }
    profiles.set(user.id, {
      userId: user.id,
      email: user.email ?? null,
      displayName: parseDisplayName(user.user_metadata),
    });
  }
  return profiles;
}
