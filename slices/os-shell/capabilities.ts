"use client";
// os-shell capabilities — adapts THIS app's theme system (next-themes, driven by
// theme-presets' ThemeProviders in the root layout) to appshell's ShellCapabilities
// contract, so the vendored shell stays brand/data-agnostic. Hook identities are
// module-level (referentially stable) per the appshell contract. Only appearance
// is real: this is a learning app, not a machine, so there's no CPU/telemetry —
// useCpuPercent returns null (chip hidden) and the system/AI/server hooks are
// omitted (appshell's graceful empty defaults apply).
import type { CSSProperties } from "react";
import { useCallback } from "react";
import { useTheme } from "next-themes";
import type { ShellAppearance, ShellCapabilities } from "@/features/appshell";
import { useShellSearch } from "./shell-search";

// Bespoke "Editorial Warmth" wallpaper — a CSS-props bag (wins over any named
// preset). Built from the app's own tokens (var(--primary) terracotta over
// var(--background) warm paper), so it re-tints itself in light AND dark with a
// single definition. Module-level = stable identity.
const EDITORIAL_WALLPAPER: CSSProperties = {
  backgroundColor: "var(--background)",
  backgroundImage: [
    "radial-gradient(120% 120% at 10% 4%, color-mix(in oklab, var(--primary) 20%, transparent), transparent 46%)",
    "radial-gradient(120% 110% at 90% 12%, color-mix(in oklab, var(--secondary) 44%, transparent), transparent 44%)",
    "radial-gradient(120% 120% at 74% 96%, color-mix(in oklab, var(--accent) 55%, transparent), transparent 52%)",
  ].join(","),
};

function useEditorialAppearance(): ShellAppearance {
  const { resolvedTheme, setTheme } = useTheme();
  const set = useCallback((t: "light" | "dark") => setTheme(t), [setTheme]);
  return {
    theme: resolvedTheme === "dark" ? "dark" : "light",
    setTheme: set,
    device: "auto",
    wallpaperStyle: EDITORIAL_WALLPAPER,
  };
}

const cpuNull = (): number | null => null;

// Study-assistant placeholder: there's no LLM backend/key yet, so stream an
// honest "coming soon" instead of appshell's silent empty-chat default (which
// leaves the Inspector AI bubble stuck on "…"). Swap for a real useChat (a convex
// httpAction) once ANTHROPIC_API_KEY is set on the self-hosted backend + deployed.
// Module-level = referentially stable, per the capabilities contract.
const ASSISTANT_SOON =
  "Asisten belajar Alfa segera hadir. Untuk sekarang, jelajahi materi, kuis, dan progres di kelas ini.";
async function* comingSoonChat(): AsyncGenerator<string> {
  for (const word of ASSISTANT_SOON.split(" ")) {
    yield word + " ";
    await new Promise((r) => setTimeout(r, 35));
  }
}
const chatComingSoon = () => comingSoonChat;

export const editorialCapabilities: ShellCapabilities = {
  useAppearance: useEditorialAppearance,
  useCpuPercent: cpuNull,
  // Spotlight ⌘K over communities + courses (existing Convex queries, run
  // imperatively). Hook reference — its returned fn is stable (see shell-search).
  useSearch: useShellSearch,
  // Inspector AI tab: honest "coming soon" stream until a real LLM backend exists.
  useChat: chatComingSoon,
};
