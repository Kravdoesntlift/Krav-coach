// ─── Cache Config ────────────────────────────────────────────────────────────
// Bump version when deploying changes to precached assets (offline page, icons)
const CACHE_NAME = "krav-v5";
const OFFLINE_URL = "/offline";

// Assets to precache on install
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
];

// ─── Install — precache shell ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ─── Activate — clean stale caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ─── Fetch — network-first for nav, cache-first for static assets ─────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and Supabase/API requests
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) return;

  // Static assets (icons, manifest, fonts) → cache-first
  if (
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/fonts/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request))
    );
    return;
  }

  // Navigation (HTML pages) → network-first, offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503 }))
      )
    );
    return;
  }
});

// ─── Push ─────────────────────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "KRAV Coach";
  const options = {
    body: data.body || "",
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: { url: data.url || "/" },
    vibrate: [200, 100, 200],
  };

  event.waitUntil(
    (async () => {
      await self.registration.showNotification(title, options);
      // Set app badge — iOS 16.4+ and Android Chrome
      if (data.badge != null) {
        try { await navigator.setAppBadge(data.badge); } catch (_) {}
      }
    })()
  );
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      try { await navigator.clearAppBadge(); } catch (_) {}
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (client.url === url && "focus" in client) { client.focus(); return; }
      }
      if (clients.openWindow) await clients.openWindow(url);
    })()
  );
});
