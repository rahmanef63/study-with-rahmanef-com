import type { MetadataRoute } from "next";

// PWA manifest (served at /manifest.webmanifest).
//
// display: REVERSAL. This was "minimal-ui" on the grounds that standalone hides
// the address bar and the address bar was the only way for an installed user to
// copy the URL of the lesson they were reading. That reason is dead:
// <TombolBagikan> (components/tombol-bagikan.tsx) now ships on every shareable
// surface, so sharing no longer depends on browser chrome. "standalone" it is,
// with display_override falling back to minimal-ui on browsers that refuse it.
//
// Colours are the arcade cabinet base tokens resolved from the oklch() values
// in globals.css — hex because a manifest cannot read a CSS variable. Note they
// are NOT the #12141f that app/icon.svg and the old manifest carried; that was
// a stale pre-retheme value, and #090f1c is what --background actually renders.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "belajar-with-rahmanef.com",
    short_name: "Belajar",
    description:
      "Platform & komunitas belajar pengaplikasian AI — gratis, terbuka, berbahasa Indonesia.",
    lang: "id",
    dir: "ltr",
    categories: ["education", "productivity"],
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "any",
    background_color: "#090f1c",
    theme_color: "#090f1c",
    prefer_related_applications: false,
    // Generated + byte-verified by scripts/generateIcons.mjs (`npm run
    // pwa:icons`) and committed, so the Docker build never rasterises anything.
    // 192 + 512 + maskable + apple is the whole useful ladder: both platforms
    // downscale from the largest icon they can use.
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/apple-touch-icon-180.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
      // Kept last: a browser that prefers vector gets it, one that wants a
      // concrete size has four PNGs above to choose from first.
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
    // Turns the Android install prompt into a rich card instead of a bare line.
    // Regenerate with `npm run pwa:screenshots` against a local production
    // build; the script asserts the PNG dimensions match the `sizes` here,
    // because Chrome silently drops a screenshot whose pixels disagree.
    screenshots: [
      {
        src: "/screenshots/narrow.png",
        sizes: "412x915",
        type: "image/png",
        form_factor: "narrow",
        label: "Beranda belajar-with-rahmanef di ponsel",
      },
      {
        src: "/screenshots/wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "Beranda belajar-with-rahmanef di layar lebar",
      },
    ],
    shortcuts: [
      {
        name: "Kelas",
        short_name: "Kelas",
        description: "Lanjutkan belajar",
        url: "/",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Komunitas lain",
        short_name: "Komunitas",
        description: "Jelajahi komunitas",
        url: "/komunitas",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Pengaturan",
        short_name: "Pengaturan",
        description: "Akun dan preferensi",
        url: "/pengaturan",
        icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
