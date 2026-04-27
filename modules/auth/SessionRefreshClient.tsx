"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const ROUTE_REFRESH_MIN_INTERVAL_MS = 2_000;

function shouldSkipRefresh(pathname: string): boolean {
  return pathname.startsWith("/login");
}

export function SessionRefreshClient() {
  const pathname = usePathname();
  const router = useRouter();
  const disabled = shouldSkipRefresh(pathname);
  const inFlightRef = useRef(false);
  const blockedByAuthRef = useRef(false);
  const lastRouteRefreshAtMsRef = useRef(0);

  useEffect(() => {
    blockedByAuthRef.current = false;
  }, [pathname]);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const refreshRouteData = () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      const nowMs = Date.now();
      if (nowMs - lastRouteRefreshAtMsRef.current < ROUTE_REFRESH_MIN_INTERVAL_MS) {
        return;
      }

      lastRouteRefreshAtMsRef.current = nowMs;
      router.refresh();
    };

    const refreshSession = async () => {
      if (inFlightRef.current || blockedByAuthRef.current) {
        return;
      }

      inFlightRef.current = true;
      try {
        const response = await fetch("/api/auth/refresh", {
          method: "POST",
          credentials: "include",
          cache: "no-store",
        });

        if (response.status === 401) {
          // Refresh token is no longer valid. Avoid repeated failing calls
          // until route changes or user logs in again.
          blockedByAuthRef.current = true;
        }
      } catch {
        // Ignore transient network errors; next focus/interval attempt retries.
      } finally {
        inFlightRef.current = false;
      }
    };

    const handleFocus = () => {
      void refreshSession();
      refreshRouteData();
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshSession();
        refreshRouteData();
      }
    };

    const handlePageShow = () => {
      void refreshSession();
      refreshRouteData();
    };

    const intervalId = window.setInterval(() => {
      void refreshSession();
    }, REFRESH_INTERVAL_MS);

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", handlePageShow);
    void refreshSession();
    refreshRouteData();

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [disabled, router]);

  return null;
}
