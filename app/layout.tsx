import type { Metadata } from "next";
import { Suspense } from "react";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { ThemeProviders, ThemePresetStyle } from "@/features/theme-presets";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// "Editorial Warmth" identity lives in the BASE tokens (app/globals.css), so
// the default preset is null — the brand shows with zero preset injection and
// the switcher's "Default" reset returns here. defaultMode stays light (warm
// paper); visitors can flip to dark or pick a preset.
const DEFAULT_MODE = "light" as const;
const DEFAULT_PRESET = null;

// Hanken Grotesk (body/UI) + Fraunces (optical display serif). Distinctive,
// warm, and — unlike Inter — not the generic default. Vars ride on <body> so
// they shadow any preset's :root font tokens.
const sans = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const SITE_DESCRIPTION =
  "Platform & komunitas belajar pengaplikasian AI — gratis, terbuka, berbahasa Indonesia.";

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
    <html lang="id" suppressHydrationWarning>
      <body className={`${sans.variable} ${serif.variable} font-sans antialiased`}>
        <ThemePresetStyle preset={DEFAULT_PRESET} />
        <ThemeProviders defaultMode={DEFAULT_MODE} defaultPreset={DEFAULT_PRESET}>
          <VersionWatcher />
          <Suspense fallback={null}>
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
