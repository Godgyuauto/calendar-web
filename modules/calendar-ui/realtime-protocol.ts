interface RealtimeMessage {
  topic?: unknown;
  event?: unknown;
  payload?: {
    event?: unknown;
  };
}

function withRealtimeTopic(topic: string): string {
  return `realtime:${topic}`;
}

export function toRealtimeWebSocketUrl(projectUrl: string, anonKey: string): string {
  const url = new URL(projectUrl);
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:";
  url.pathname = "/realtime/v1/websocket";
  url.search = "";
  url.searchParams.set("apikey", anonKey);
  url.searchParams.set("vsn", "1.0.0");
  return url.toString();
}

export function buildRealtimeJoinMessage(topic: string, ref: string): string {
  return JSON.stringify({
    topic: withRealtimeTopic(topic),
    event: "phx_join",
    payload: {
      config: {
        broadcast: { ack: false, self: false },
        presence: { enabled: false },
        private: false,
      },
    },
    ref,
    join_ref: ref,
  });
}

export function buildRealtimeHeartbeatMessage(ref: string): string {
  return JSON.stringify({
    topic: "phoenix",
    event: "heartbeat",
    payload: {},
    ref,
  });
}

export function isCalendarChangedBroadcast(data: string, topic: string): boolean {
  try {
    const message = JSON.parse(data) as RealtimeMessage;
    return (
      message.topic === withRealtimeTopic(topic) &&
      message.event === "broadcast" &&
      message.payload?.event === "calendar_changed"
    );
  } catch {
    return false;
  }
}
