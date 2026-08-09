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
        // Committed build output (scripts/generateIcons.mjs,
        // generateScreenshots.mjs). NOT `immutable`: the filenames carry the
        // SIZE, not a content hash, so regenerating icon-512.png reuses the URL
        // — which is exactly what happened when the brand mark's page gutters
        // were fixed. `immutable` would have pinned the old art in every
        // returning browser for a year with no way to bust it. A week is long
        // enough for assets that change about once a quarter.
        source: "/icons/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800" }],
      },
      {
        source: "/screenshots/:file*",
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
