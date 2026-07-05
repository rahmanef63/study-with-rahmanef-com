import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import { ConvexClientProvider } from "@/components/convex-provider";
import { ThemeProviders } from "@/features/theme-presets";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "belajar-with-rahmanef.com",
    template: "%s — belajar-with-rahmanef.com",
  },
  description:
    "Platform & komunitas belajar pengaplikasian AI — gratis, terbuka, berbahasa Indonesia.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProviders>
          <Suspense fallback={null}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </Suspense>
        </ThemeProviders>
        <Toaster position="bottom-right" />
      </body>
    </html>
  );
}
