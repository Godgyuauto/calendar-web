const CACHE_VERSION = "family-shift-v9";
const OFFLINE_URL = "/offline.html";
const CACHE_TARGETS = [OFFLINE_URL];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(CACHE_TARGETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((staleKey) => caches.delete(staleKey)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.kind === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  // Navigation requests must prefer network so date/schedule UI is always fresh.
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch {
          const fallback = await caches.match(OFFLINE_URL);
          return fallback || Response.error();
        }
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        return await fetch(event.request);
      } catch {
        const cached = await caches.match(event.request);
        if (cached) {
          return cached;
        }

        const fallback = await caches.match(OFFLINE_URL);
        return fallback || Response.error();
      }
    })(),
  );
});

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {
    title: "가족 교대 캘린더",
    body: "새 일정이 업데이트되었습니다.",
    tag: "family-shift-update",
    url: "/",
  };

  try {
    const data = event.data.json();
    payload = {
      title: typeof data.title === "string" ? data.title : payload.title,
      body: typeof data.body === "string" ? data.body : payload.body,
      tag: typeof data.tag === "string" ? data.tag : payload.tag,
      url: typeof data.url === "string" ? data.url : payload.url,
    };
  } catch {
    // Keep fallback payload when push body is not JSON.
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      tag: payload.tag,
      data: {
        url: payload.url,
      },
      icon: "/icons/icon-192-v2.png",
      badge: "/icons/icon-192-v2.png",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const nextUrl = event.notification?.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ("focus" in client) {
          client.postMessage({ kind: "push-click", url: nextUrl });
          client.navigate(nextUrl);
          return client.focus();
        }
      }
      return clients.openWindow(nextUrl);
    }),
  );
});
