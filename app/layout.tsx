import type { Metadata, Viewport } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { LocalStoragePurge } from "@/components/local-storage-purge";
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
};

export const metadata: Metadata = {
  metadataBase: new URL("https://study-with.rahmanef.com"),
  title: {
    default: "belajar-with-rahmanef.com",
    template: "%s — belajar-with-rahmanef.com",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    locale: "id_ID",
    siteName: "belajar-with-rahmanef.com",
    title: "belajar-with-rahmanef.com",
    description: SITE_DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // `dark` is permanent: one theme, no switcher (see globals.css).
    <html lang="id" className={`dark ${sans.variable} ${display.variable}`}>
      {/* `antialiased` is deliberately OFF: subpixel smoothing muddies a pixel
          font. The scanline overlay is a fixed pseudo-element on <body> — see
          .scanlines in globals.css. */}
      <body className="scanlines font-sans">
        {/* React hoists resource links to <head>. */}
        {CONVEX_ORIGIN && <link rel="preconnect" href={CONVEX_ORIGIN} />}
        <VersionWatcher />
        <LocalStoragePurge />
        {/* No Suspense wrapper here on purpose. It used to exist because the
            OS shell's UrlSync read window.location during prerender, which
            suspended EVERY route to a full-screen splash. Pages own their own
            boundaries around the specific reads that are dynamic. */}
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
