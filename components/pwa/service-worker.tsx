"use client";

import { useEffect } from "react";

/**
 * Registers /sw.js and swaps in a new worker when one is waiting.
 *
 * WHY THERE IS NO TOAST HERE — read this before adding one.
 * components/version-watcher.tsx already owns the single "Versi baru tersedia
 * — muat ulang" prompt, and it is the BETTER detector: it polls
 * /api/version for the Next BUILD_ID, so it fires on every deploy and works in
 * browsers with no service worker at all (iOS Lockdown Mode, private windows,
 * http). A service-worker `updatefound` only fires when the BYTES OF /sw.js
 * change — which for this app is almost never, since a normal deploy ships new
 * hashed chunks and an unchanged worker. Prompting off that signal would mean a
 * reload toast that appears for the one deploy in twenty that edits the worker,
 * and appears SECOND, next to VersionWatcher's. Two "reload now" toasts for one
 * event is the bug the brief warned about.
 *
 * So the division is: VersionWatcher asks the user, this asks nobody. When a
 * new worker is waiting we post SKIP_WAITING immediately and let it activate in
 * the background — the page is not reloaded and nothing user-visible changes,
 * because the only things this worker owns are content-addressed assets and the
 * offline page. By the time the user acts on VersionWatcher's toast, the new
 * worker is already the one that will serve the reload.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    // Guarded to production. A worker registered by a local `next start` lives
    // on the same localhost origin as `next dev` and would keep serving the
    // built shell into the dev session, so tear it down instead of registering.
    if (process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        for (const reg of regs) void reg.unregister();
      });
      if ("caches" in window) {
        void caches.keys().then((keys) => {
          for (const key of keys) if (key.startsWith("belajar-shell-")) void caches.delete(key);
        });
      }
      return;
    }

    /** Tell a waiting worker to take over. Safe mid-session: see the note above. */
    const activate = (worker: ServiceWorker | null) => {
      if (worker?.state === "installed") worker.postMessage({ type: "SKIP_WAITING" });
    };

    let cancelled = false;
    // `load` keeps registration off the critical path — on a mid-range Android
    // the SW install competes with first paint for the same single core.
    const start = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .then((registration) => {
          if (cancelled) return;
          activate(registration.waiting);
          registration.addEventListener("updatefound", () => {
            const installing = registration.installing;
            installing?.addEventListener("statechange", () => activate(installing));
          });
        })
        .catch(() => {
          // Non-fatal: the app is fully functional without a worker.
        });
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
    };
  }, []);

  return null;
}
