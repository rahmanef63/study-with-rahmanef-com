"use client";

// Closes the phone slide-over the moment the viewport grows past `md`.
//
// WHY THIS EXISTS. The nav lives in two places — a persistent rail at md and
// up, and a Sheet below it — and `md:hidden` on the trigger is not enough,
// because a Sheet that was ALREADY OPEN when the viewport crossed 768px stays
// open. Measured at 390 → 1280 with the panel open: two visible copies of
// `nav[aria-label="Bagian komunitas"]` (the rail underneath, the sheet on top),
// the content column clipped by the 280px panel, and — the part that actually
// hurts — `body { overflow: hidden }` still held by the dialog's scroll lock.
// The page looks like the ordinary desktop dashboard and silently will not
// scroll, with no visible control to escape.
//
// It is not a hypothetical: a 390x844 phone in landscape is 844px wide, so
// rotating the device with the menu open is enough.
import { useEffect } from "react";

/** Tailwind's `md`. Keep in step with the `md:hidden` on the bar itself. */
const MD = "(min-width: 768px)";

export function useCloseAboveMd(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const mq = window.matchMedia(MD);
    // Guard the initial state too: a resize that happens between the click and
    // this effect running would otherwise never fire `change`.
    if (mq.matches) {
      close();
      return;
    }
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [open, close]);
}
