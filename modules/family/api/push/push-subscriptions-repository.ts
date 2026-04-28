import type { FamilyAuthContext } from "../_common/auth-context";

interface PushSupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

interface PushSubscriptionRow {
  endpoint: string;
  p256dh: string;
  auth: string;
  family_id: string;
  user_id: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

function getPushSupabaseConfig(): PushSupabaseConfig {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    throw new Error("Push repository is not configured. Set SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY.");
  }

  return {
    url: url.replace(/\/+$/, ""),
    serviceRoleKey,
  };
}

function buildServiceHeaders(prefer?: string): HeadersInit {
  const { serviceRoleKey } = getPushSupabaseConfig();
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

function buildServiceUrl(path: string): string {
  return `${getPushSupabaseConfig().url}${path}`;
}

async function assertOk(response: Response, fallback: string): Promise<void> {
  if (response.ok) {
    return;
  }

  let message = fallback;
  try {
    const payload = (await response.json()) as { message?: string; error?: string };
    if (typeof payload.message === "string" && payload.message.length > 0) {
      message = payload.message;
    } else if (typeof payload.error === "string" && payload.error.length > 0) {
      message = payload.error;
    }
  } catch {
    // Keep fallback message when payload is not JSON.
  }

  throw new Error(`${message} (status=${response.status})`);
}

function isValidPushSubscription(input: PushSubscriptionInput): boolean {
  return (
    typeof input.endpoint === "string" &&
    input.endpoint.length > 0 &&
    typeof input.keys?.p256dh === "string" &&
    input.keys.p256dh.length > 0 &&
    typeof input.keys?.auth === "string" &&
    input.keys.auth.length > 0
  );
}

export async function upsertPushSubscription(
  auth: FamilyAuthContext,
  subscription: PushSubscriptionInput,
  userAgent?: string,
): Promise<void> {
  if (!isValidPushSubscription(subscription)) {
    throw new Error("Invalid push subscription payload.");
  }

  const body = [
    {
      family_id: auth.familyId,
      user_id: auth.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: typeof userAgent === "string" ? userAgent.slice(0, 256) : null,
    },
  ];

  const response = await fetch(buildServiceUrl("/rest/v1/push_subscriptions?on_conflict=endpoint"), {
    method: "POST",
    headers: buildServiceHeaders("resolution=merge-duplicates,return=minimal"),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  await assertOk(response, "Failed to save push subscription.");
}

export async function deleteOwnPushSubscription(
  auth: FamilyAuthContext,
  endpoint: string,
): Promise<void> {
  const query = new URLSearchParams({
    endpoint: `eq.${endpoint}`,
    family_id: `eq.${auth.familyId}`,
    user_id: `eq.${auth.userId}`,
  }).toString();

  const response = await fetch(buildServiceUrl(`/rest/v1/push_subscriptions?${query}`), {
    method: "DELETE",
    headers: buildServiceHeaders("return=minimal"),
    cache: "no-store",
  });

  await assertOk(response, "Failed to delete push subscription.");
}

export async function listFamilyPushSubscriptions(
  familyId: string,
): Promise<PushSubscriptionRow[]> {
  const query = new URLSearchParams({
    select: "endpoint,p256dh,auth,family_id,user_id",
    family_id: `eq.${familyId}`,
  }).toString();

  const response = await fetch(buildServiceUrl(`/rest/v1/push_subscriptions?${query}`), {
    method: "GET",
    headers: buildServiceHeaders(),
    cache: "no-store",
  });

  await assertOk(response, "Failed to list push subscriptions.");
  const json = (await response.json()) as unknown;
  return Array.isArray(json) ? (json as PushSubscriptionRow[]) : [];
}

export async function deletePushSubscriptionByEndpoint(
  familyId: string,
  endpoint: string,
): Promise<void> {
  const query = new URLSearchParams({
    endpoint: `eq.${endpoint}`,
    family_id: `eq.${familyId}`,
  }).toString();

  const response = await fetch(buildServiceUrl(`/rest/v1/push_subscriptions?${query}`), {
    method: "DELETE",
    headers: buildServiceHeaders("return=minimal"),
    cache: "no-store",
  });

  await assertOk(response, "Failed to cleanup push subscription.");
}
