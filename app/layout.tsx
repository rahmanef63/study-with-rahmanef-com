import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { Suspense } from "react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { Loader2 } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { AnalyticsBeacon } from "@/components/analytics-beacon";
import { ThemeProviders, ThemePresetStyle } from "@/features/theme-presets";
import { Toaster } from "@/components/ui/sonner";
// appshell.css first so app globals.css cascades last and wins the shared
// `--accent` token (shadcn's warm-neutral surface, not appshell's default blue).
// The terracotta brand still reaches the shell via --primary/--ring/--foreground.
import "@/features/appshell/appshell.css";
import "./globals.css";

// "Editorial Warmth" identity lives in the BASE tokens (app/globals.css), so
// the default preset is null — the brand shows with zero preset injection and
// the switcher's "Default" reset returns here. defaultMode stays light (warm
// paper); visitors can flip to dark or pick a preset.
const DEFAULT_MODE = "light" as const;
const DEFAULT_PRESET = null;

// Hanken Grotesk (body/UI) + Fraunces (optical display serif). Distinctive,
// warm, and — unlike Inter — not the generic default. Vars ride on <html> (not
// <body>) so they are the DEFAULT: a tweakcn preset that ships its own --font-*
// (injected as a later <style> in <body>) overrides them, and "Default" falls
// back here. So fonts follow the active preset, Editorial is the baseline.
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const SITE_DESCRIPTION =
  "Platform & komunitas belajar pengaplikasian AI — gratis, terbuka, berbahasa Indonesia.";

// Convex origin preconnect — every window's content is Convex data over WSS,
// but the client only starts the DNS+TCP+TLS handshake after the JS bundle has
// downloaded and executed. A static <link rel="preconnect"> in the prerendered
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

// Splash backdrop — mirrors os-shell's EDITORIAL_WALLPAPER (capabilities.ts)
// so the static-shell splash hands off to the desktop wallpaper seamlessly.
// Token-driven, so it tracks light/dark and theme presets with zero JS.
const SPLASH_BACKDROP: CSSProperties = {
  backgroundColor: "var(--background)",
  backgroundImage: [
    "radial-gradient(120% 120% at 10% 4%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 46%)",
    "radial-gradient(120% 110% at 90% 12%, color-mix(in oklab, var(--secondary) 44%, transparent), transparent 44%)",
    "radial-gradient(120% 120% at 74% 96%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 52%)",
  ].join(","),
};

// viewportFit:"cover" lets the standalone PWA draw edge-to-edge so the shell's
// env(safe-area-inset-*) tokens (--sai-*) resolve on notched phones; without it
// they are always 0 and the iOS/Android top bars sit under the status bar.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
        <ThemePresetStyle preset={DEFAULT_PRESET} />
        <ThemeProviders defaultMode={DEFAULT_MODE} defaultPreset={DEFAULT_PRESET}>
          <VersionWatcher />
          {/* Cookieless visitor beacon — fires page_view on OS window/URL change
              (History API), gated off admin/console paths. Own Suspense: it reads
              usePathname, which forces dynamic without a boundary under
              cacheComponents. */}
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
          {/* This subtree suspends during prerender (appshell's UrlSync reads
              the URL), so under PPR the fallback IS the first paint of every
              route. A static brand splash on the editorial backdrop instead of
              a blank page; the dynamic stream replaces it. Root-cause (chrome
              in the static shell) belongs upstream in os-vps appshell — wrap
              <UrlSync/> in its own Suspense there, then re-sync. */}
          <Suspense
            fallback={
              <div
                className="fixed inset-0 grid place-items-center bg-background"
                style={SPLASH_BACKDROP}
              >
                <div className="flex flex-col items-center gap-3">
                  <LogoMark className="size-10 text-primary" />
                  <Loader2 className="size-4 animate-spin text-muted-foreground" aria-hidden />
                  <span className="sr-only">Memuat…</span>
                </div>
              </div>
            }
          >
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </Suspense>
          {/* Inside ThemeProviders so the theme-aware Toaster's useTheme()
              tracks the in-app light/dark toggle, not the OS media query. */}
          <Toaster position="bottom-right" />
        </ThemeProviders>
      </body>
    </html>
  );
}
