import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Lora } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { ThemeProviders, ThemePresetStyle } from "@/features/theme-presets";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// "Akademik & Tenang" build-time look (UI-UX-PRD §1). One source of truth for
// the default preset so the pre-hydration inline CSS and the provider agree.
const DEFAULT_MODE = "light" as const;
const DEFAULT_PRESET = "nature";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
// Serif display for the "Akademik & Tenang" hierarchy (UI-UX-PRD §1.2).
// Vars ride on <body> → they shadow any preset's :root font tokens.
const lora = Lora({ subsets: ["latin"], variable: "--font-serif" });

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
      <body className={`${inter.variable} ${lora.variable} font-sans antialiased`}>
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
