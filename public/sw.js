// ─── Cache Config ────────────────────────────────────────────────────────────
// Bump CACHE_VERSION on every deploy to force cache refresh.
const CACHE_VERSION = "krav-v7";
const STATIC_CACHE  = `${CACHE_VERSION}-static`;   // /_next/static/ — immutable JS/CSS
const PAGES_CACHE   = `${CACHE_VERSION}-pages`;    // SSR page HTML
const ASSETS_CACHE  = `${CACHE_VERSION}-assets`;   // icons, images, fonts
const OFFLINE_URL   = "/offline";

const ALL_CACHES = [STATIC_CACHE, PAGES_CACHE, ASSETS_CACHE];

// ─── Install — precache shell ─────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE).then((cache) =>
      cache.addAll([OFFLINE_URL, "/manifest.json", "/icon.svg", "/icon.png"])
           .catch(() => cache.addAll([OFFLINE_URL, "/manifest.json", "/icon.svg"]))
    )
  );
  self.skipWaiting();
});

// ─── Activate — clean stale caches ───────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ALL_CACHES.includes(k))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET requests from our own origin
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // ── /_next/static/ — Cache-First (immutable: filenames include content hash) ──
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(STATIC_CACHE, request));
    return;
  }

  // ── Static assets (icons, images, fonts, manifest) — Cache-First ─────────
  if (
    url.pathname === "/manifest.json" ||
    url.pathname.startsWith("/icon") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(png|svg|jpg|jpeg|webp|avif|ico|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(cacheFirst(ASSETS_CACHE, request));
    return;
  }

  // ── API routes — Network-Only (auth-gated, real-time data) ───────────────
  if (url.pathname.startsWith("/api/")) return;

  // ── Next.js RSC payload requests — redirect to /offline on failure ────────
  if (request.headers.get("RSC") === "1") {
    event.respondWith(
      fetch(request).catch(() =>
        Response.redirect(new URL("/offline", self.location.origin).href, 302)
      )
    );
    return;
  }

  // ── Page navigations — Network-First, cache last response, offline fallback ─
  if (request.mode === "navigate") {
    event.respondWith(networkFirstPage(request));
    return;
  }

  // ── Everything else — Network with asset cache fallback ───────────────────
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

// ─── Strategies ───────────────────────────────────────────────────────────────

async function cacheFirst(cacheName, request) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    return new Response("Offline", { status: 503 });
  }
}

async function networkFirstPage(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Only cache text/html responses
      const ct = response.headers.get("content-type") ?? "";
      if (ct.includes("text/html")) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch {
    // Offline: serve last cached version of this page
    const cached = await cache.match(request);
    if (cached) return cached;
    // Final fallback: offline page
    const offline = await caches.match(OFFLINE_URL);
    return offline || new Response("Offline", { status: 503 });
  }
}

// ─── Background Sync — replay offline actions ─────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-krav-actions") {
    event.waitUntil(replayOfflineQueue());
  }
});

async function replayOfflineQueue() {
  // The actual replay is handled by useOfflineSync hook in the React app.
  // We just need to wake up any open clients so they can drain the queue.
  const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
  for (const client of clientList) {
    client.postMessage({ type: "SYNC_QUEUE" });
  }
}

// ─── Push Notifications ───────────────────────────────────────────────────────
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
      if (data.badge != null) {
        try { await navigator.setAppBadge(data.badge); } catch (_) {}
      }
    })()
  );
});

// ─── Notification Click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    (async () => {
      try { await navigator.clearAppBadge(); } catch (_) {}
      const clientList = await clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clientList) {
        if (new URL(client.url).pathname === new URL(url, self.location.origin).pathname && "focus" in client) {
          client.focus();
          return;
        }
      }
      if (clients.openWindow) await clients.openWindow(url);
    })()
  );
});

// ─── Message from app ─────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
