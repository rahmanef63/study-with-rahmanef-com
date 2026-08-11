"use client";
// `prefers-reduced-motion`, as a subscription rather than a one-shot read.
//
// The swipe deck reads this to decide whether a card follows the finger at
// all. It is a REAL branch, not a shorter animation: for a vestibular-disorder
// user a card that rotates and flies off screen is the symptom, so under
// `reduce` the deck becomes two buttons and a static card — the same
// interaction everyone else can already reach with the keyboard.
//
// `useSyncExternalStore` (not useState + useEffect) because the server
// snapshot has to be explicit: during SSR there is no matchMedia, and
// defaulting to `false` there matches what a browser reports before the media
// query resolves, so hydration cannot mismatch.
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void): () => void {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return () => {};
  }
  const mql = window.matchMedia(QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function getSnapshot(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

/** True when the visitor asked their OS for less motion. */
export function useReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
