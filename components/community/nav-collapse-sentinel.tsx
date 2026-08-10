"use client";

// The one bit of JS in the phone nav: a 1px marker parked directly under the
// large title. When it crosses the bottom edge of the compact bar, the large
// title has slid underneath — the exact moment iOS swaps a UINavigationBar to
// its collapsed state.
//
// IntersectionObserver, not a scroll listener. The crossing is computed by the
// compositor and the callback fires TWICE per scroll session instead of sixty
// times a second, and nothing in the scroll path reads a layout property, so
// there is no thrash to rAF-throttle away.
//
// The result is published as `<html data-nav-collapsed>` rather than React
// state so the bar itself can stay a server component (see community-nav-bar).
import { useEffect, useRef } from "react";

export function NavCollapseSentinel() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const root = document.documentElement;

    // ONE layout read, at mount, off the scroll path: the bar's real height —
    // which on a notched phone includes the safe-area inset that rootMargin
    // cannot express as env().
    const bar = document.querySelector<HTMLElement>("[data-community-navbar]");
    const offset = Math.round(bar?.getBoundingClientRect().height ?? 50);

    const io = new IntersectionObserver(
      ([entry]) => {
        root.dataset.navCollapsed = String(!entry.isIntersecting);
      },
      { rootMargin: `-${offset}px 0px 0px 0px`, threshold: 0 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      // Navigating out of /k must not strand the rest of the app collapsed.
      delete root.dataset.navCollapsed;
    };
  }, []);

  // md:hidden — the bar it drives is phone-only, and this keeps the desktop
  // header's height byte-identical to what it was before.
  return <div ref={ref} aria-hidden className="h-px w-full md:hidden" />;
}
