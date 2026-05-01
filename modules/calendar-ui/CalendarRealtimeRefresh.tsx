"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  buildRealtimeHeartbeatMessage,
  buildRealtimeJoinMessage,
  isCalendarChangedBroadcast,
  toRealtimeWebSocketUrl,
} from "@/modules/calendar-ui/realtime-protocol";

interface CalendarRealtimeRefreshProps {
  topic: string | null;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
}

export function CalendarRealtimeRefresh({
  topic,
  supabaseUrl,
  supabaseAnonKey,
}: CalendarRealtimeRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (!topic || !supabaseUrl || !supabaseAnonKey || typeof WebSocket === "undefined") {
      return;
    }

    let ref = 1;
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const socket = new WebSocket(toRealtimeWebSocketUrl(supabaseUrl, supabaseAnonKey));
    const nextRef = () => String(ref++);
    const heartbeat = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(buildRealtimeHeartbeatMessage(nextRef()));
      }
    }, 25_000);

    socket.addEventListener("open", () => {
      socket.send(buildRealtimeJoinMessage(topic, nextRef()));
    });
    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string" || !isCalendarChangedBroadcast(event.data, topic)) {
        return;
      }
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      refreshTimer = setTimeout(() => router.refresh(), 250);
    });

    return () => {
      clearInterval(heartbeat);
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      socket.close();
    };
  }, [router, supabaseAnonKey, supabaseUrl, topic]);

  return null;
}
