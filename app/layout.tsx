import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { LocalStoragePurge } from "@/components/local-storage-purge";
import { ServiceWorkerRegistrar } from "@/components/pwa/service-worker";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Arcade type pair. Pixelify Sans is the body face — a pixel font that still
// has real lowercase and word shapes, so a lesson paragraph stays readable.
// Press Start 2P is the cabinet marquee: display sizes only (globals.css caps
// h1/h2 with clamp() because every glyph is full-width and a normal display
// scale would overflow a phone).
const sans = Pixelify_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
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
  // Declared explicitly rather than left to the app/icon.svg file convention:
  // once any `icons` field is set it replaces the auto-detected set, and iOS
  // needs a real PNG (it will not use an SVG for a home-screen icon).
  // No app/apple-icon.tsx — that would rasterise the same art again through
  // next/og at request time to produce a file scripts/generateIcons.mjs has
  // already emitted, byte-verified and committed.
  // NOTE: `icons` and `manifest` are deliberately NOT declared here — they are
  // rendered as plain JSX below so React hoists them into <head> at SSR time.
  // See the comment at that call site; putting them in Metadata broke install
  // on every /k route.
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
    <html lang="id" className={`dark ${sans.variable} ${display.variable}`}>
      {/* `antialiased` is deliberately OFF: subpixel smoothing muddies a pixel
          font. The scanline overlay is a fixed pseudo-element on <body> — see
          .scanlines in globals.css. */}
      <body className="scanlines font-sans" style={SAFE_AREA}>
        {/* React hoists resource links to <head>. */}
        {CONVEX_ORIGIN && <link rel="preconnect" href={CONVEX_ORIGIN} />}
        {/* THE INSTALL-CRITICAL LINKS, rendered as JSX rather than declared in
            `metadata`. React hoists a bare <link> into <head> during SSR; the
            Metadata API does not, when any level of the route's metadata is
            async.
            /k/[slug] has an async generateMetadata (it awaits the tenant from
            Convex), so Next flushed the shell without metadata and streamed
            <title>, the icons AND <link rel="manifest"> into <body> instead —
            measured: </head> closed at byte 2110, the manifest link sat at
            37243. Chrome only honours rel="manifest" inside <head>, so the
            entire PWA was inert on every route a learner actually uses: no
            install prompt, no app icon. iOS reads apple-touch-icon at parse
            time too, so "Add to Home Screen" had no icon either.
            Static-metadata routes (/changelog, /komunitas, /pengaturan) were
            fine, which is exactly why probing those said the PWA worked. */}
        {/* Yes, this duplicates the tag Next auto-injects for app/manifest.ts.
            Harmless — identical href, and a browser takes the first in document
            order, which is now always this one. Suppressing Next's copy would
            mean giving up the typed MetadataRoute and serving the manifest as a
            static public/ file, which is a worse trade than one repeated link. */}
        <link rel="manifest" href="/manifest.webmanifest" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="icon" href="/icons/icon-192.png" sizes="192x192" type="image/png" />
        <link rel="icon" href="/icons/icon-512.png" sizes="512x512" type="image/png" />
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
            It used to wrap {children}, which put every router update inside
            document.startViewTransition(). React animates EVERY transition
            update inside such a boundary — a Suspense reveal included — and
            every page under /k has 3–4 Suspense boundaries, so one tap produced
            two or three consecutive whole-app entrances. Measured on a
            throttled 390px phone: 1.2s of continuous sliding across three
            transitions, the middle one animating a frame in which the DOM had
            not changed at all.
            It cannot be fixed in CSS: `transition.types` is empty here (Next 16
            tags neither the router push nor the Suspense reveal), so no
            selector can single out the extra runs. Naming the chrome only fixed
            the SECOND, smaller defect — the sticky bar being painted twice
            mid-slide — while leaving the content pane re-entering 2–3x.
            The route animations and the reserved chrome names are gone from
            app/globals.css with it. A dashboard whose rail stays put has no
            business sliding its content pane in from the right anyway; if
            motion is wanted back it has to be a bounded CSS animation on the
            content pane, not a document-level view transition.
            Orphaned by this change and safe to delete:
            components/ui/view-transition.tsx, components/ui/route-direction.tsx
            and `experimental.viewTransition` in next.config.mjs. */}
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
