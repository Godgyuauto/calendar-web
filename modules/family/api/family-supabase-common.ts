import type { FamilyAuthContext } from "@/modules/family/api/auth-context";

interface SupabaseConfig {
  url: string;
  anonKey: string;
}

interface ApiFailure {
  message: string;
  status: number;
}

export class FamilyRepositoryError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isSafeStatus(status: number): boolean {
  return [400, 401, 403, 404, 409, 422].includes(status);
}

function getSupabaseConfig(): SupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey =
    process.env.SUPABASE_ANON_KEY?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new FamilyRepositoryError(
      "Server database is not configured. Set SUPABASE_URL/SUPABASE_ANON_KEY.",
      503,
    );
  }

  return { url: url.replace(/\/+$/, ""), anonKey };
}

async function parseResponseMessage(response: Response): Promise<string | undefined> {
  try {
    const json = (await response.json()) as { message?: string; error?: string };
    return json.message ?? json.error;
  } catch {
    return undefined;
  }
}

export async function assertSupabaseResponseOk(
  response: Response,
  fallback: string,
): Promise<void> {
  if (response.ok) {
    return;
  }

  const message = (await parseResponseMessage(response)) ?? fallback;
  const status = isSafeStatus(response.status) ? response.status : 503;
  throw new FamilyRepositoryError(message, status);
}

export function buildSupabaseHeaders(
  auth: FamilyAuthContext,
  prefer?: string,
): HeadersInit {
  const config = getSupabaseConfig();
  return {
    apikey: config.anonKey,
    Authorization: `Bearer ${auth.accessToken}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export function buildSupabaseUrl(path: string): string {
  return `${getSupabaseConfig().url}${path}`;
}

export async function readJsonArray<T>(response: Response): Promise<T[]> {
  const data = (await response.json()) as unknown;
  return Array.isArray(data) ? (data as T[]) : [];
}

export function getFamilyRepositoryFailure(error: unknown): ApiFailure | null {
  if (error instanceof FamilyRepositoryError) {
    return { message: error.message, status: error.status };
  }
  return null;
}
