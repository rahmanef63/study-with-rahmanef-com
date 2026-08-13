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
// v2: all four precached icons were replaced by the SWR asset pack (the
// procedural book mark is gone). Same URLs, different bytes — without this
// bump an installed user keeps serving the old art from the v1 cache forever.
// v3: /offline now renders an <img>. A bump is REQUIRED, not hygiene — the
// install handler is the only thing that ever fills the precache, and it runs
// once per worker version. Without a bump, every already-installed user keeps
// the v2 cache, never fetches the new URL, and gets the broken-image icon on
// the exact screen that exists to work offline.
// v4: OFFLINE_IMAGE moved from /ui/offline.webp to /web/banner-skyline.webp and
// the old file was DELETED. Worse than v3's stale-bytes case — without this
// bump an installed user's precache points at a URL that now 404s, so the one
// screen designed to survive a dead network shows a broken image on it.
const VERSION = "v4";
const CACHE = `belajar-shell-${VERSION}`;

/** The only asset /offline references. Named because two lists need it.
 *  Shared with app/not-found.tsx, so a 404 hit while offline is already here. */
const OFFLINE_IMAGE = "/web/banner-skyline.webp";

// "/" is deliberately NOT precached. Navigations never read from the cache
// (see below), so a precached home page would be bytes that go stale and are
// never served.
const PRECACHE = [
  "/offline",
  // …plus whatever stylesheet /offline references — resolved at install time,
  // see below. Precaching the HTML alone gave an unstyled Game Paused page to
  // anyone who installed from the manifest and went offline before their first
  // real navigation (the CSS otherwise only lands via the opt-in SWR path).

  // The skyline strip /offline renders. Precached for the obvious reason and
  // ALSO matched by CACHEABLE below for the non-obvious one — see there.
  OFFLINE_IMAGE,
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon-180.png",
];

/** Content-addressed or immutable — the only things safe to serve from cache first.
 *
 *  OFFLINE_IMAGE is the one non-immutable entry, and PRECACHING IT IS NOT
 *  ENOUGH ON ITS OWN — that is why it is also here. A path that misses this
 *  predicate falls out of the fetch handler with no respondWith(), handing the
 *  request back to the browser; cached bytes the handler never consults cannot
 *  be served.
 *
 *  MEASURED, because the obvious test lies. Install the worker without visiting
 *  /offline, go offline, force a 404: the image still renders even with this
 *  line removed. The HTTP cache is covering it — next.config.mjs puts
 *  `max-age=604800` on /web, and the precache's own cache.add() fetch is what
 *  warms it. Clear the HTTP cache first (a 7-day expiry, an eviction, or that
 *  header ever being reverted to Next's `max-age=0, must-revalidate` default)
 *  and the two diverge cleanly: with this line naturalWidth is 1200, without it
 *  naturalWidth is 0 and /offline paints the broken-image icon. So the header
 *  buys a week; this line is what makes it durable and independent of a config
 *  file this worker does not control.
 *
 *  Scoped to this exact file rather than all of /ui/: the sibling asset pass
 *  left the /social /ui /web /learning /profiles question open on the grounds
 *  that those images "only appear on pages a network is needed to render
 *  anyway". True of every one of them except this one — /offline is by
 *  definition the page rendered with no network — so the exception is exactly
 *  one file wide. The rest stay plain network until someone has a reason. */
const CACHEABLE = (pathname) =>
  pathname.startsWith("/_next/static/") ||
  pathname.startsWith("/icons/") ||
  pathname.startsWith("/screenshots/") ||
  pathname === OFFLINE_IMAGE;

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
