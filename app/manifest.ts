import type { MetadataRoute } from "next";

// PWA manifest (served at /manifest.webmanifest). display is "minimal-ui", NOT
// "standalone": standalone hides the address bar, and with the OS desktop gone
// the address bar IS the share affordance — an installed user must be able to
// copy the URL of the lesson they are reading. Colors = the arcade cabinet base
// tokens (CRT black, coin gold) as hex, since manifests cannot read CSS
// variables.
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
    display: "minimal-ui",
    orientation: "any",
    background_color: "#12141f",
    theme_color: "#12141f",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
    shortcuts: [
      { name: "Kelas", short_name: "Kelas", url: "/" },
      { name: "Komunitas lain", short_name: "Komunitas", url: "/komunitas" },
      { name: "Pengaturan", short_name: "Pengaturan", url: "/pengaturan" },
    ],
  };
}
