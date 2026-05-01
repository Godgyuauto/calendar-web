import type { FamilyAuthContext } from "./auth-context";
import { buildFamilyCalendarRealtimeTopic } from "./family-realtime-topic";

function getBroadcastConfig(): { url: string; key: string } | null {
  const url = process.env.SUPABASE_URL?.trim() ?? process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ??
    process.env.SUPABASE_ANON_KEY?.trim() ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    return null;
  }

  return { url: url.replace(/\/+$/, ""), key };
}

export async function broadcastFamilyCalendarChange(
  auth: FamilyAuthContext,
  source: "override",
): Promise<void> {
  const config = getBroadcastConfig();
  if (!config) {
    return;
  }

  await fetch(`${config.url}/realtime/v1/api/broadcast`, {
    method: "POST",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messages: [
        {
          topic: buildFamilyCalendarRealtimeTopic(auth.familyId),
          event: "calendar_changed",
          payload: { source, at: new Date().toISOString() },
        },
      ],
    }),
  }).catch(() => undefined);
}
