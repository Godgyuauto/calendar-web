import { describe, expect, it } from "vitest";
import {
  buildRealtimeHeartbeatMessage,
  buildRealtimeJoinMessage,
  isCalendarChangedBroadcast,
  toRealtimeWebSocketUrl,
} from "./realtime-protocol";

describe("toRealtimeWebSocketUrl", () => {
  it("builds a Supabase realtime websocket URL", () => {
    expect(
      toRealtimeWebSocketUrl("https://example.supabase.co/", "sb_publishable_key"),
    ).toBe(
      "wss://example.supabase.co/realtime/v1/websocket?apikey=sb_publishable_key&vsn=1.0.0",
    );
  });
});

describe("realtime protocol messages", () => {
  it("builds a public broadcast channel join message", () => {
    expect(JSON.parse(buildRealtimeJoinMessage("family-calendar:abc", "1"))).toEqual({
      topic: "realtime:family-calendar:abc",
      event: "phx_join",
      payload: {
        config: {
          broadcast: { ack: false, self: false },
          presence: { enabled: false },
          private: false,
        },
      },
      ref: "1",
      join_ref: "1",
    });
  });

  it("builds a heartbeat message", () => {
    expect(JSON.parse(buildRealtimeHeartbeatMessage("2"))).toEqual({
      topic: "phoenix",
      event: "heartbeat",
      payload: {},
      ref: "2",
    });
  });
});

describe("isCalendarChangedBroadcast", () => {
  it("accepts calendar change broadcast messages for the topic", () => {
    expect(
      isCalendarChangedBroadcast(
        JSON.stringify({
          topic: "realtime:family-calendar:abc",
          event: "broadcast",
          payload: { event: "calendar_changed", payload: { source: "override" } },
        }),
        "family-calendar:abc",
      ),
    ).toBe(true);
  });

  it("ignores other topics and events", () => {
    expect(
      isCalendarChangedBroadcast(
        JSON.stringify({
          topic: "realtime:family-calendar:other",
          event: "broadcast",
          payload: { event: "calendar_changed" },
        }),
        "family-calendar:abc",
      ),
    ).toBe(false);
  });
});
