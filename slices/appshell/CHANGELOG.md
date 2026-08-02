# Changelog — appshell

## 1.6.1 — 2026-07-18

UX-performance audit fixes (mirror upstream to os-vps before the next sync so
they don't get overwritten):

- **desktop.tsx**: the Surface `<Suspense>` around the active shell now shows a
  centered `Loader2` spinner (same pattern as window-content.tsx) instead of
  `fallback={null}` — users on a lazy shell (windows/android/dashboard) no
  longer stare at a bare wallpaper while the shell chunk loads on cold boot.
- **widgets-defs-vps.tsx**: MarkdownWidget memoizes `mdToHtml(md)` with
  `useMemo` — the regex pipeline no longer re-runs on every desktop widget-layer
  re-render for an unchanged note.
- Metadata: slice.json + slice.manifest.json synced at 1.6.1 (manifest was
  stale at 1.5.1 since the 1.6.0 port).

## 1.6.0 — 2026-07-18

UI/UX parity port from the current os-vps appshell (upstream is months ahead of
the 1.5.1 lift). Wholesale diff of the slice, PRESERVING the `[study-with fork]`
files (menu-bar-status, android-shell, dashboard-shell/-parts, windows/taskbar,
control-center mobile) and the study-only agent layer (agentic.tsx, lib/tools.ts,
lib/mock-capabilities.ts). Highlights:

- **Theme/CSS**: appshell.css rebuilt from upstream globals — z-scale (--z-*),
  glass tokens (--glass-panel/-nc/-hi/-stroke, --fill/--fill2, --grouped),
  per-shell skins ([data-shell] --shell-font/radius/icon-*/ease/dur*, Win11
  --mica-win via color-mix on --primary), webp wallpapers (.wp-* over gradient
  fallbacks, assets in public/wallpapers/), window/app motion keyframes
  (winOpen/winClose/winMin, appOpen/appClose, .win-geo glide, toastIn,
  wpFloatA/B), reduced-motion collapse (1ms so animationend still fires),
  pointer-coarse 44px targets + 16px input floor, iOS switch parity. Dark stays
  keyed to next-themes' `.dark` (not upstream's [data-theme]); app/globals.css
  still remaps chrome tokens onto the shadcn palette so presets restyle the shell.
- **New features/components**: desktop-icons (defaults adapted to this app's
  ids), force-quit, widget picker/registry/defs, context-menu host + zones,
  hot-corners, window-overview (Mission Control), snap-layouts + win-caption +
  window tabs/preview, app-actions-sheet, android-notifications, run-dialog,
  control-center tiles/desktop popover, spotlight results + MRU history,
  wallpaper registry/per-shell prefs (live wallpapers), dock prefs, host-api
  seam, lazy register-shells.
- **Mobile UX**: upstream d60a05b + bbac7da fixes — swipeable 3-page home (no
  stray touch-action:pan-y), tappable page dots, top-anchored lock-screen clock,
  HomeIndicator pointer-capture, safe-area floors, PWA manifest + viewportFit
  cover + touch-action:manipulation (app-level).
- **Storage keys** renamed to this repo's namespace (`study-with:*`).
- App-level: `@custom-variant dark` + `tw-animate-css` (new devDep) in
  globals.css — animate-in/slide-in utilities were silent no-ops before.

## 1.5.1 — 2026-06-10

- Host wiring: `AppShell` self-registers `appshellTools` (module-store ctx) via `useAgentTools` — the whole desktop becomes agent-drivable on mount.

## 1.5.0 — 2026-06-10

- Agentic tool collection (`lib/tools.ts`): `appshellTools` exports 12
  function-calling tools for the shared agent kit (`@/shared/agentic`).
  The slice is NOT an agent — register the collection with a host agent
  (e.g. assistant's `registerAssistantTools(appshellTools, () => ctx)`);
  one agent drives many slices. Contract now declares `provides.tools`.
