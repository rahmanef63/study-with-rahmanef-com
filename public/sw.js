// Hand-written service worker. No workbox / serwist / next-pwa — this is the
// whole thing, and it is short enough to read in one sitting.
//
// Shape borrowed from ~/projects/CareerPack/frontend/public/sw.js. What is
// DELIBERATELY DIFFERENT here, and why:
//
//  1. CareerPack stale-while-revalidates every same-origin GET that isn't
//     /api/. This app is Convex-backed and realtime, and its HTML is rendered
//     per-request, so a blanket SWR would happily hand a member the shell of a
//     page they no longer have access to. Here SWR is opt-IN and limited to
//     content-addressed paths (CACHEABLE below): /_next/static/** (hashed by
//     the build, including the next/font woff2 files) plus our own committed
//     /icons and /screenshots. Everything else — every route, every API call —
//     is untouched network.
//  2. No `cache.addAll`: one 404 rejects the whole batch and you silently ship
//     a worker with an empty precache. Each entry is added independently.
//  3. Navigation responses are NOT written back to the cache. CareerPack caches
//     them so a visited URL works offline; this app's pages are authed,
//     member-scoped and realtime, so a cached navigation is a stale authed view
//     waiting to happen. Offline navigations get /offline, full stop.
//
// BUMP `VERSION` ON EVERY RELEASE THAT CHANGES A PRECACHED FILE. Everything in
// PRECACHE is an unhashed URL, so nothing else invalidates them. The activate
// handler deletes every cache that isn't the current one.
const VERSION = "v1";
const CACHE = `belajar-shell-${VERSION}`;

// "/" is deliberately NOT precached. Navigations never read from the cache
// (see below), so a precached home page would be bytes that go stale and are
// never served.
const PRECACHE = [
  "/offline",
  // …plus whatever stylesheet /offline references — resolved at install time,
  // see below. Precaching the HTML alone gave an unstyled Game Paused page to
  // anyone who installed from the manifest and went offline before their first
  // real navigation (the CSS otherwise only lands via the opt-in SWR path).
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
];

/** Content-addressed or immutable — the only things safe to serve from cache first. */
const CACHEABLE = (pathname) =>
  pathname.startsWith("/_next/static/") ||
  pathname.startsWith("/icons/") ||
  pathname.startsWith("/screenshots/");

/** Never touched, at any cost: realtime data, per-request images, auth. */
const NEVER = (pathname) =>
  pathname.startsWith("/api/") ||
  pathname.startsWith("/_next/data/") ||
  pathname.startsWith("/_next/image");

/** The hashed stylesheet /offline links to. Parsed from the page itself so the
 *  hash never has to be hardcoded or kept in sync with a build. */
async function offlineStylesheets() {
  try {
    const res = await fetch("/offline", { cache: "reload" });
    if (!res.ok) return [];
    const html = await res.text();
    return [...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1]);
  } catch {
    return []; // offline at install time — the SWR path will pick it up later
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const css = await offlineStylesheets();
      // Individually, so one failure cannot abort the whole precache the way
      // cache.addAll() would.
      await Promise.all(
        [...PRECACHE, ...css].map((url) => cache.add(url).catch(() => null))
      );
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Convex WSS/HTTPS, fonts, images
  if (NEVER(url.pathname)) return;

  // Navigations: network-first, /offline as the floor. No cache write-back.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match("/offline")
          .then((cached) => cached ?? new Response("Offline", { status: 503 }))
      )
    );
    return;
  }

  if (!CACHEABLE(url.pathname)) return;

  // Stale-while-revalidate for immutable assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok && response.type === "basic") {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached ?? Response.error());
      return cached ?? network;
    })
  );
});
