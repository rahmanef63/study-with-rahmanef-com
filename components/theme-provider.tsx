"use client";

// Light/dark only.
//
// This replaces slices/theme-presets — a 1,154-LOC tweakcn preset engine that
// shipped a 241 KB registry JSON so any visitor could repaint a charity
// learning platform in 37 themes. The product has a bespoke identity
// ("Editorial Warmth": Fraunces + Hanken Grotesk over terracotta oklch tokens
// in app/globals.css) and the default preset was already null, so the engine
// was 241 KB doing nothing. next-themes was already a dependency.
import { ThemeProvider } from "next-themes";

export function ThemeProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      // Warm paper is the brand; visitors can still flip to dark or follow the
      // device. enableSystem stays on but light is the default, not `system`.
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
