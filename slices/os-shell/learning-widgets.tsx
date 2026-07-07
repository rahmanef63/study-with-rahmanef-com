"use client";
// Learning widgets — replaces appshell's dead system-stats cards (CPU/mem/disk,
// which render "—" forever since we wire no useSystemStats). Fed by the
// recent-courses localStorage tracker, so it works logged-out with zero Convex.
// One component fills both the mobile Today page and the desktop widget stack.
import { useEffect, useState } from "react";
import { GraduationCap, PlayCircle } from "lucide-react";
import { defineFeature } from "@/features/appshell";
import { getRecentCourses, type RecentCourse } from "./recent-courses";
import { openApp } from "./apps/_nav";

function ProgressWidget() {
  // Client-only (localStorage): start empty, hydrate after mount to avoid an SSR
  // mismatch — same pattern as beranda-app's LanjutkanBelajar.
  const [recents, setRecents] = useState<RecentCourse[]>([]);
  useEffect(() => setRecents(getRecentCourses()), []);

  return (
    <div
      className="rounded-2xl border border-border/60 p-3.5 text-foreground backdrop-blur-xl"
      style={{ background: "var(--glass-menu)" }}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-[12.5px] font-semibold">Lanjutkan belajar</span>
        <span className="ml-auto text-[12.5px] font-bold tabular-nums text-primary">
          {recents.length || ""}
        </span>
      </div>

      {recents.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground">
          Buka sebuah kelas untuk mulai melacak progres.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recents.slice(0, 3).map((c) => (
            <li key={`${c.tenantSlug}/${c.courseSlug}`}>
              <button
                type="button"
                onClick={() => openApp("kelas", c.title, [c.tenantSlug, c.courseSlug])}
                className="flex min-h-9 w-full items-center gap-2 rounded-lg px-1.5 py-1 text-left transition-colors hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <PlayCircle className="size-3.5 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 truncate text-[12px] font-medium">{c.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Reuses the "widgets" id so it slots exactly where appshell's default widget
// feature did (the manifest filters that one out and appends this).
export const learningWidgetsFeature = defineFeature({
  id: "widgets",
  kind: "custom",
  slots: { today: ProgressWidget, desktopWidgets: ProgressWidget },
});
