"use client";

// One-shot cleanup of keys the retired OS desktop left in returning visitors'
// browsers: window geometry, dock prefs, wallpaper choice, spaces, pins,
// clipboard history, recents, theme presets. `study-with:os` alone is a
// serialized window layout that no longer means anything.
//
// Harmless to skip, but there is no other reset path — the Settings "Tentang"
// section that could clear them was deleted with the shell. Delete this
// component (and its mount in app/layout.tsx) after ~2026-11.
import { useEffect } from "react";

const PREFIXES = ["sv:", "study-with:", "swr:"] as const;
const DONE_KEY = "swr:purged-os-keys";

export function LocalStoragePurge() {
  useEffect(() => {
    try {
      if (localStorage.getItem(DONE_KEY) === "1") return;
      // Collect first: removeItem() during the index walk reindexes the store
      // and silently skips keys.
      const doomed: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key !== DONE_KEY && PREFIXES.some((p) => key.startsWith(p))) doomed.push(key);
      }
      doomed.forEach((key) => localStorage.removeItem(key));
      localStorage.setItem(DONE_KEY, "1");
    } catch {
      // Private mode / storage disabled. Nothing to clean up in that case.
    }
  }, []);

  return null;
}
