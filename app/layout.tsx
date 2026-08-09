import type { Metadata, Viewport } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ThemeProviders } from "@/components/theme-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { LocalStoragePurge } from "@/components/local-storage-purge";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Hanken Grotesk (body/UI) + Fraunces (optical display serif). Distinctive,
// warm, and — unlike Inter — not the generic default. Vars ride on <html> so
// the "Editorial Warmth" identity in app/globals.css is the baseline
// everywhere.
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
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
    <html lang="id" suppressHydrationWarning className={`${sans.variable} ${serif.variable}`}>
      <body className="font-sans antialiased">
        {/* React hoists resource links to <head>; rendered here so it lands in
            the PPR static shell of every route. */}
        {CONVEX_ORIGIN && <link rel="preconnect" href={CONVEX_ORIGIN} />}
        <ThemeProviders>
          <VersionWatcher />
          <LocalStoragePurge />
          {/* No Suspense wrapper here on purpose. It used to exist because the
              OS shell's UrlSync read window.location during prerender, which
              suspended EVERY route to a full-screen splash — its own comment
              admitted the fallback was the first paint of the whole site. Pages
              now own their boundaries around the specific reads that are
              dynamic, so the static shell is real content. */}
          <ConvexClientProvider>{children}</ConvexClientProvider>
          {/* Inside ThemeProviders so the theme-aware Toaster's useTheme()
              tracks the in-app light/dark toggle, not the OS media query. */}
          <Toaster position="bottom-right" />
        </ThemeProviders>
      </body>
    </html>
  );
}
