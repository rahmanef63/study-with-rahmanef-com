/** @type {import('next').NextConfig} */

// Flagship community — mirrors DEFAULT_COMMUNITY_SLUG in lib/community.ts. Only
// used to point the retired shell-level deep links at something real.
const DEFAULT_COMMUNITY = process.env.NEXT_PUBLIC_DEFAULT_COMMUNITY_SLUG ?? "belajar-ai";

const nextConfig = {
  output: "standalone",
  // cacheComponents (PPR) is OFF. It was turned on so the ONE catch-all route
  // that rendered the OS desktop stayed statically prerenderable — a goal that
  // died with the desktop. Every page now reads request data (params, or a
  // Convex etalase query), so under PPR each one needs its whole body inside a
  // Suspense boundary or the build fails with "uncached data accessed outside
  // <Suspense>"; the only way to satisfy that globally is a root boundary whose
  // fallback becomes the first paint of the entire site, which is exactly the
  // splash-screen behaviour we just deleted. Conventional SSR gives crawlers
  // and first paint the same real HTML, and this deploys to a single Node
  // server on Dokploy where a prerendered shell buys nothing.
  // The per-page <Suspense> boundaries stay: they still stream.
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
    // `viewTransition` WAS here and is deliberately gone. It let React's
    // <ViewTransition> put router updates inside document.startViewTransition()
    // — but React animates EVERY transition update inside that boundary,
    // including a Suspense reveal, and every /k page has 3–4 boundaries. One
    // tap therefore played the whole-app entrance two or three times back to
    // back: measured at 1.2s of continuous sliding on a throttled phone, with
    // the middle transition animating a frame that had not changed at all.
    // That is the "terbuka 2 kali" the owner reported. It cannot be fixed in
    // CSS: `transition.types` is empty because Next 16 tags neither the router
    // push nor the reveal, so no selector can target one and not the other.
    // Do not switch it back on without a way to scope it to navigations.
  },
  // Every URL below was a live OS-shell deep link, shared in WhatsApp and
  // Discord and — more importantly — PERSISTED in notifications.href rows that
  // predate the route migration. These redirects are load-bearing, not polish:
  // without them the pivot breaks the exact thing it exists to fix.
  // Order matters: the more specific lesson/quiz patterns must precede the
  // course pattern.
  async redirects() {
    return [
      { source: "/beranda", destination: "/", permanent: true },
      {
        source: "/kelas/:tenant/:course/lesson/:lessonId",
        destination: "/k/:tenant/kelas/:course/:lessonId",
        permanent: true,
      },
      {
        source: "/kuis/:tenant/:course/:moduleId",
        destination: "/k/:tenant/kelas/:course/kuis/:moduleId",
        permanent: true,
      },
      { source: "/kelas/:tenant/:course", destination: "/k/:tenant/kelas/:course", permanent: true },
      { source: "/kelas/:tenant", destination: "/k/:tenant", permanent: true },
      { source: "/komunitas/:slug", destination: "/k/:slug", permanent: true },
      // The three boards are now post KINDS on one Diskusi feed (#33). `?kind=`
      // and not `#sumber`: the category filter is component state, so a
      // fragment would have nothing on the page to scroll to. The Diskusi page
      // parses this param (parsePostKind) and opens the feed on that chip.
      { source: "/resources/:tenant", destination: "/k/:tenant/diskusi?kind=sumber", permanent: true },
      { source: "/pengumuman/:tenant", destination: "/k/:tenant/diskusi?kind=pengumuman", permanent: true },
      { source: "/cari/:tenant", destination: "/k/:tenant/cari", permanent: true },
      { source: "/kelola/:tenant/:path*", destination: "/k/:tenant/kelola", permanent: true },
      // Public profile moved off the OS app slug onto a short handle route.
      { source: "/profil/:username", destination: "/u/:username", permanent: true },
      { source: "/profil", destination: "/pengaturan", permanent: true },
      // Docs were a static OS app; the content is now the Bantuan section of
      // the flagship community's Tentang page.
      { source: "/docs", destination: `/k/${DEFAULT_COMMUNITY}/tentang#bantuan`, permanent: true },
      // Retired shell surfaces with no successor.
      { source: "/asisten", destination: "/", permanent: true },
    ];
  },
  // Everything under public/ is served with the same default caching, which is
  // exactly wrong for a service worker and exactly too weak for the icons.
  async headers() {
    return [
      {
        // A service worker that its own HTTP cache can hand back stale is a
        // worker that can never update itself — and this one is the only thing
        // standing between an offline user and a browser error page. Modern
        // browsers bypass the HTTP cache for the SW script anyway, but that is
        // recent behaviour and Traefik sits in front of us.
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache" },
          // Belt and braces: lets the worker claim "/" no matter what path it
          // is ever served from.
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        // Committed art. NOT `immutable`: the filenames carry the SIZE, not a
        // content hash, so replacing icon-512.png reuses the URL. `immutable`
        // would pin the old art in every returning browser for a year with no
        // way to bust it, and a week is long enough for assets that change
        // about once a quarter.
        //
        // RE-CHECKED against the asset-pack upload, and the reasoning did not
        // just survive — that upload is the exact event it was written for.
        // Every one of these four URLs kept its name and changed its bytes
        // wholesale (the procedural book-and-spark mark was replaced by real
        // artwork). Under `immutable` a returning installed user would still be
        // looking at the old placeholder on their home screen in 2027. Under a
        // week they roll over on their own. Note the HTTP cache is only half of
        // it: these same four URLs are precached by public/sw.js, whose cache
        // is keyed on VERSION and does NOT expire — that file was bumped to v2
        // for this upload, and it has to be bumped again next time. A stale
        // icon after an art change means someone forgot the VERSION, not this
        // header.
        source: "/icons/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/screenshots/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        // The rest of the asset pack: link-unfurl cards (/social), the external
        // brand wordmarks (/brand), and the art our own <img> tags render
        // (/ui, /web, /learning, /profiles). Next serves everything under
        // public/ as `max-age=0, must-revalidate` by default, so before this
        // rule every one of these images cost a conditional request on every
        // navigation that mounted it — for files that are hand-committed and
        // change about never.
        //
        // Same week, and same reason it is not `immutable`: none of these
        // filenames carry a content hash either, so `hero.webp` has to stay
        // replaceable in place. Keeping the number identical to /icons is
        // deliberate — one asset-pack refresh should age out of every browser
        // on one clock, not several.
        //
        // Separate from the SW question: these paths are NOT in the CACHEABLE
        // allowlist in public/sw.js, so nothing here is served from the service
        // worker cache. That was left alone on purpose. An HTTP max-age expires
        // by itself; an SW cache entry only leaves when VERSION is bumped, so
        // opting 2 MB of art into it buys offline reach at the cost of one more
        // thing that goes stale silently. Not worth it for images that only
        // appear on pages a network is needed to render anyway.
        source: "/:dir(social|brand|ui|web|learning|profiles)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
