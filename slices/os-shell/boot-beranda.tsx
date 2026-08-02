"use client";

import { useEffect } from "react";
import { shellStore, openWindow } from "@/features/appshell";
import { APPS } from "./manifest";

// Cold-boot fallback: when the desktop loads on "/" with no deep link and no
// restored layout, open Beranda so the user never lands on an empty desktop.
// Rendered as a SIBLING placed AFTER <AppShell/> in OsRoot — React flushes
// passive effects in fiber post-order, so by the time THIS effect runs, both
// UrlSync's URL→state deep-link open AND usePersistLayout's hydrateBoot restore
// (both earlier in <AppShell>'s subtree) have already mutated the module store.
// The two guards then make it a no-op on a deep link or a restored layout;
// openWindow is single-instance, so even a redundant call just refocuses.
export function BootBeranda() {
  useEffect(() => {
    if (window.location.pathname !== "/") return; // deep-linked → UrlSync opened it
    if (shellStore.getOrder().length > 0) return; // restored / deep-link window present
    const beranda = APPS.find((a) => a.id === "beranda");
    if (beranda) openWindow(beranda.id, beranda.title, beranda.defaultSize);
  }, []);
  return null;
}
