import type { MetadataRoute } from "next";

// PWA manifest (served at /manifest.webmanifest). Installable standalone app —
// pairs with viewportFit:"cover" in layout.tsx so the OS shell can read the
// env(safe-area-inset-*) vars on notched phones. `shortcuts` give the installed
// icon a long-press / right-click jump menu straight into an app (deep-linked
// via the catch-all route's slugs). Colors = the Editorial Warmth base tokens
// (warm paper background, terracotta primary) as hex, since manifests can't
// read CSS variables.
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
    background_color: "#fbf8f3",
    theme_color: "#fbf8f3",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Beranda", short_name: "Beranda", url: "/beranda" },
      { name: "Komunitas", short_name: "Komunitas", url: "/komunitas" },
      { name: "Profil", short_name: "Profil", url: "/profil" },
    ],
  };
}
