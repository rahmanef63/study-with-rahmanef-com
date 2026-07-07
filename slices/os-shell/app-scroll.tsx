// No "use client": AppScroll is a pure presentational div (no hooks/handlers) and
// `scrollize` must stay universal — manifest.tsx calls it at module-eval, which
// runs on the SERVER during build config-collection. A "use client" here would make
// scrollize a client reference and throw "called from the server" at build time.
//
// Every OS app renders into a window body that is `overflow-hidden` (the macOS/
// Windows/Dashboard shells clip content to their rounded frame). Without an inner
// scroll container, anything taller than the window is silently cut off — the
// "missing features" were just below the fold. AppScroll gives every app one
// minimalist vertical scroll area that fills the window and scrolls its overflow.
// The mobile shell already scrolls its body, so h-full here just fills it exactly
// (the inner area owns the single scrollbar; the outer one never engages).
import type { ComponentType, ReactNode } from "react";
import type { AppProps } from "@/features/appshell";

export function AppScroll({ children }: { children: ReactNode }) {
  return (
    <div className="scroll-minimal h-full overflow-y-auto overflow-x-hidden overscroll-contain">
      {children}
    </div>
  );
}

// Wraps an app's lazy `load()` so its component mounts inside AppScroll — one call
// per manifest entry instead of editing every app and every return branch. The
// resolved module is cached so the wrapped component keeps a STABLE identity across
// re-opens: a fresh identity each load would remount the app and drop its state.
export function scrollize(
  load: () => Promise<{ default: ComponentType<AppProps> }>,
): () => Promise<{ default: ComponentType<AppProps> }> {
  let cached: { default: ComponentType<AppProps> } | null = null;
  return async () => {
    if (cached) return cached;
    const { default: Inner } = await load();
    function Scrolled(props: AppProps) {
      return (
        <AppScroll>
          <Inner {...props} />
        </AppScroll>
      );
    }
    Scrolled.displayName = `Scrolled(${Inner.displayName ?? Inner.name ?? "App"})`;
    cached = { default: Scrolled };
    return cached;
  };
}
