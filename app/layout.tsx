import type { Metadata, Viewport } from "next";
import { Press_Start_2P } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { LocalStoragePurge } from "@/components/local-storage-purge";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// ONE downloaded face, and it is the marquee only.
//
// Pixelify Sans used to be the BODY face, on the argument that it kept enough
// word shape for prose. The owner read the site and said "fontnya agak sulit
// dibaca", and they were right: a pixel face costs legibility on every glyph,
// and 128 materi of Bahasa-Indonesia prose is where nearly all the glyphs are.
// The arcade styling is the wrapper; when the wrapper taxes the product, the
// wrapper loses. Identity is unharmed — Press Start 2P still carries every
// heading, the brand and the chrome. Body text uses the platform UI stack:
// hinted for the reader's own screen, no swap, and downloads NOTHING.
const display = Press_Start_2P({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const SITE_DESCRIPTION =
  "Platform & komunitas belajar pengaplikasian AI — gratis, terbuka, berbahasa Indonesia.";

// Convex origin preconnect — reactive content arrives over WSS, but the client
// only starts the DNS+TCP+TLS handshake after the JS bundle has downloaded and
// executed. A static <link rel="preconnect"> in the prerendered
// head starts it with the first HTML bytes. Derived from the build-time env
// (never hardcoded — deployments differ); null-safe so a missing env just
// omits the hint instead of failing the build.
const CONVEX_ORIGIN = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    return url ? new URL(url).origin : null;
  } catch {
    return null;
  }
})();

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // The manifest asks for display "standalone", so an installed app draws under
  // the notch and the home indicator. Without viewportFit "cover" the UA letter-
  // boxes those areas and every env(safe-area-inset-*) resolves to 0px, which
  // would silently break the fixed bottom nav that depends on them.
  viewportFit: "cover",
  // Paints the Android status bar / desktop title bar in the cabinet's CRT
  // black instead of browser white. Same value as background_color in
  // app/manifest.ts — see that file for why it is #090f1c and not #12141f.
  themeColor: "#090f1c",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://study-with.rahmanef.com"),
  title: {
    default: "belajar-with-rahmanef.com",
    template: "%s — belajar-with-rahmanef.com",
  },
  description: SITE_DESCRIPTION,
  applicationName: "Belajar",
  // iOS ignores the web app manifest almost entirely; "Add to Home Screen"
  // reads these three meta tags instead. `capable` is what makes the installed
  // icon open without Safari chrome, matching the manifest's standalone
  // display, and black-translucent lets the page paint under the status bar
  // (which is why viewportFit "cover" above is not optional).
  appleWebApp: {
    capable: true,
    title: "Belajar",
    statusBarStyle: "black-translucent",
  },
  // `icons` and `manifest` are deliberately NOT declared here. They are plain
  // JSX in the body below, because React hoists a <link> into <head> at SSR and
  // the Metadata API does not on async-metadata routes — declaring them here
  // broke install on every /k route. Read the comment at that call site first.
  // No app/apple-icon.tsx either: it would rasterise art per request to make
  // /icons/apple-touch-icon-180.png, which is committed artwork already.
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "belajar-with-rahmanef.com",
    title: "belajar-with-rahmanef.com",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  // Next 16 emits only the standard `mobile-web-app-capable`. iOS before 15.4
  // reads the legacy name and will otherwise open the installed icon in Safari
  // chrome instead of standalone. One line, and cheap insurance for the older
  // hand-me-down iPhones a charity learning app actually lands on.
  other: { "apple-mobile-web-app-capable": "yes" },
};

// Safe-area insets, promoted from env() into plain custom properties on <body>.
//
// PUBLISHED CONTRACT for the fixed bottom nav (and anything else that touches a
// screen edge): read --safe-b / --safe-t / --safe-l / --safe-r. They resolve to
// 0px everywhere that has no inset, so they are always safe to add:
//
//   .bottom-nav { padding-bottom: var(--safe-b); }
//   main        { padding-bottom: calc(var(--nav-h) + var(--safe-b)); }
//
// Why vars and not raw env() at each call site: env() is not usable inside
// Tailwind arbitrary values without escaping gymnastics, and a var() indirection
// means the insets can be stubbed in a test or a screenshot run by overriding
// four properties in one place. Set inline here rather than in globals.css
// because that file belongs to another agent this cycle.
const SAFE_AREA = {
  "--safe-t": "env(safe-area-inset-top, 0px)",
  "--safe-r": "env(safe-area-inset-right, 0px)",
  "--safe-b": "env(safe-area-inset-bottom, 0px)",
  "--safe-l": "env(safe-area-inset-left, 0px)",
} as React.CSSProperties;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` is permanent: one theme, no switcher (see globals.css).
    <html lang="id" className={`dark ${display.variable}`}>
      {/* `antialiased` is deliberately OFF: subpixel smoothing muddies a pixel
          font. The scanline overlay is a fixed pseudo-element on <body> — see
          .scanlines in globals.css. */}
      <body className="scanlines font-sans" style={SAFE_AREA}>
        {/* React hoists resource links to <head>. */}
        {CONVEX_ORIGIN && <link rel="preconnect" href={CONVEX_ORIGIN} />}
        {/* THE INSTALL-CRITICAL LINKS. DO NOT MOVE THESE INTO `metadata`.
            React hoists a bare <link> into <head> during SSR. The Metadata API
            does NOT, when any level of the route's metadata is async — and
            /k/[slug] has an async generateMetadata (it awaits the tenant from
            Convex), so Next flushed the shell first and streamed the icons and
            <link rel="manifest"> into <body>. Chrome only honours rel=manifest
            inside <head>, so the PWA was inert on every route a learner
            actually uses; iOS reads apple-touch-icon at parse time, so "Add to
            Home Screen" had no icon either. Static-metadata routes were fine,
            which is why probing /changelog said the PWA worked.
            STILL TRUE IN NEXT 16.2.10, re-measured on the standalone server:
            on /k/belajar-ai, Next's own manifest link lands at byte 24312 while
            </head> closes at 2734 — and the JSX copy below sits at 2002, safely
            inside. On /komunitas and /changelog there is no stray copy at all.
            That asymmetry IS the bug, and this block is what neutralises it.
            The duplicate tag on async routes is harmless: identical href, and
            ours comes first in document order. Suppressing Next's copy would
            mean giving up the typed MetadataRoute — a worse trade. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        {/* Vector first: a browser that reads `type` takes the 1.4 KB SVG and
            stops. The rest is the fallback ladder for UAs that ignore rel=icon
            SVGs (Safari). 16/32/48 are real exports from the asset pack — they
            used to be downscaled from the 192, which resamples flat pixel art
            off its own lattice and blurs it. Ascending, so 512 is last and a UA
            that takes the final entry instead of reading `sizes` gets the
            largest rather than the smallest. */}
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/icons/icon-32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/icons/icon-48.png" sizes="48x48" type="image/png" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icons/icon-512.png" sizes="512x512" type="image/png" />
        {/* Separate rel, and not optional: iOS will not fall back to a manifest
            icon for "Add to Home Screen". */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon-180.png" sizes="180x180" />
        {/* VersionWatcher owns the ONE "muat ulang" prompt; the registrar below
            deliberately stays silent. See components/pwa/service-worker.tsx. */}
        <VersionWatcher />
        <ServiceWorkerRegistrar />
        <LocalStoragePurge />
        {/* No Suspense wrapper here on purpose. It used to exist because the
            OS shell's UrlSync read window.location during prerender, which
            suspended EVERY route to a full-screen splash. Pages own their own
            boundaries around the specific reads that are dynamic. */}
        {/* NO <ViewTransition> HERE, AND THAT IS THE FIX FOR "terbuka 2 kali".
            Wrapping {children} put every router update inside
            document.startViewTransition(), and React animates EVERY transition
            update in that boundary — Suspense reveals included — so one tap
            replayed the whole-app entrance 2–3x. Full measurement and why CSS
            cannot scope it: the `experimental` block in next.config.mjs.
            Orphaned by this change and safe to delete:
            components/ui/view-transition.tsx, components/ui/route-direction.tsx. */}
        <ConvexClientProvider>{children}</ConvexClientProvider>
        {/* The 3.5rem of lift removed here cleared <CommunityBottomNav/>, the
            fixed 56px bar this rebuild deleted. Nothing is bottom-anchored any
            more — a left rail at md+, a left Sheet below — so a toast floating
            56px above nothing reads as a bug. Do not restore the lift. */}
        <Toaster
          position="bottom-right"
          mobileOffset={{
            bottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
            left: "1rem",
            right: "1rem",
          }}
        />
      </body>
    </html>
  );
}
