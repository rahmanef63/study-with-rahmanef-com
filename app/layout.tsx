import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Lora } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { VersionWatcher } from "@/components/version-watcher";
import { ThemeProviders } from "@/features/theme-presets";
import { Toaster } from "sonner";
import "./globals.css";

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
        <ThemeProviders defaultMode="light" defaultPreset="nature">
          <VersionWatcher />
          <Suspense fallback={null}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </Suspense>
        </ThemeProviders>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
