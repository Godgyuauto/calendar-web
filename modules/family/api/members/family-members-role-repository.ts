import type { FamilyAuthContext } from "../_common/auth-context";

interface SupabaseServiceConfig {
  url: string;
  serviceRoleKey: string;
}

interface FamilyMemberRoleRow {
  id: string;
}

export type FamilyMemberDbRole = "admin" | "editor";

export class FamilyMembersRoleRepositoryError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getSupabaseServiceConfig(): SupabaseServiceConfig {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new FamilyMembersRoleRepositoryError(
      "Family members role repository is not configured. Set SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.",
      503,
    );
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function buildServiceUrl(path: string): string {
  return `${getSupabaseServiceConfig().url}${path}`;
}

function buildServiceHeaders(prefer?: string): HeadersInit {
  const { serviceRoleKey } = getSupabaseServiceConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

async function parseMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { message?: unknown; error?: unknown };
    if (typeof payload.message === "string" && payload.message.length > 0) {
      return payload.message;
    }
    if (typeof payload.error === "string" && payload.error.length > 0) {
      return payload.error;
    }
  } catch {
    // Keep fallback message on non-JSON payloads.
  }

  return undefined;
}

async function assertOk(response: Response, fallbackMessage: string): Promise<void> {
  if (response.ok) {
    return;
  }

  const message = (await parseMessage(response)) ?? fallbackMessage;
  const status = [400, 401, 403, 404, 409, 422].includes(response.status)
    ? response.status
    : 503;
  throw new FamilyMembersRoleRepositoryError(message, status);
}

export async function updateFamilyMemberRoleFromSupabase(
  auth: FamilyAuthContext,
  targetUserId: string,
  role: FamilyMemberDbRole,
): Promise<void> {
  const query = new URLSearchParams({
    family_id: `eq.${auth.familyId}`,
    user_id: `eq.${targetUserId}`,
    select: "id",
    limit: "1",
  }).toString();

  const response = await fetch(buildServiceUrl(`/rest/v1/family_members?${query}`), {
    method: "PATCH",
    headers: buildServiceHeaders("return=representation"),
    body: JSON.stringify({ role }),
    cache: "no-store",
  });

  await assertOk(response, "Failed to update member role.");
  const rows = (await response.json().catch(() => [])) as FamilyMemberRoleRow[];
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new FamilyMembersRoleRepositoryError("Target family member not found.", 404);
  }
}

export function getFamilyMembersRoleRepositoryFailure(
  error: unknown,
): { message: string; status: number } | null {
  if (error instanceof FamilyMembersRoleRepositoryError) {
    return { message: error.message, status: error.status };
  }
  return null;
}
