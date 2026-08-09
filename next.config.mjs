/** @type {import('next').NextConfig} */

// Flagship community — mirrors DEFAULT_COMMUNITY_SLUG in lib/community.ts. Only
// used to point the retired shell-level deep links at something real.
const DEFAULT_COMMUNITY = process.env.NEXT_PUBLIC_DEFAULT_COMMUNITY_SLUG ?? "belajar-ai";

const nextConfig = {
  output: "standalone",
  cacheComponents: true,
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
      // The three boards now live as sections of one Diskusi page.
      { source: "/resources/:tenant", destination: "/k/:tenant/diskusi#sumber", permanent: true },
      { source: "/pengumuman/:tenant", destination: "/k/:tenant/diskusi#pengumuman", permanent: true },
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
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
