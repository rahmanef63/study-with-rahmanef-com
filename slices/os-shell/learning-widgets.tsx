"use client";
// Learning widget — the "Lanjutkan belajar" resume card. v1.7 (#37): fed by
// use-resume-courses (server truth lintas perangkat utk yang login, digabung
// recents localStorage — tetap berfungsi logged-out). ONE card, THREE sizes
// (S/M/L, persisted), shown in EVERY shell: the mobile Today page + the macOS/Windows
// desktop widget stack + the Android home + the Dashboard home. Size is changed via a
// header button OR a right-click on the card (reuses appshell's desktop ContextMenu —
// there is no Radix ContextMenu in this repo). Colours + SHAPE follow the active theme
// preset via --glass-menu (translucent preset --card) and --radius-win (preset radius).
import { useEffect, useState } from "react";
import { Check, GraduationCap, PlayCircle, SlidersHorizontal } from "lucide-react";
import { defineFeature } from "@/features/appshell";
import {
  ContextMenu,
  useContextMenu,
  type MenuItem,
} from "@/features/appshell/components/shells/context-menu";
import { cn } from "@/lib/utils";
import { useResumeCourses } from "./use-resume-courses";
import { openApp } from "./apps/_nav";

// ── size preference (S/M/L) ──────────────────────────────────────────────────
type WidgetSize = "s" | "m" | "l";
const SIZE_KEY = "swr:widget-size";
const SIZE_ITEMS: Record<WidgetSize, number> = { s: 2, m: 3, l: 6 }; // recents shown
const SIZE_WIDTH: Record<WidgetSize, string> = { s: "w-56", m: "w-72", l: "w-96" }; // desktop column
const SIZE_LABEL: Record<WidgetSize, string> = { s: "Kecil", m: "Sedang", l: "Besar" };

function readSize(): WidgetSize {
  if (typeof window === "undefined") return "m";
  const v = window.localStorage.getItem(SIZE_KEY);
  return v === "s" || v === "l" ? v : "m";
}

// Only one widget instance mounts at a time (a shell renders EITHER `today` OR
// `desktopWidgets`, never both), so local state is enough — no cross-instance store.
// Start "m" and hydrate from localStorage after mount to avoid an SSR mismatch.
function useWidgetSize(): [WidgetSize, (s: WidgetSize) => void] {
  const [size, setSize] = useState<WidgetSize>("m");
  useEffect(() => setSize(readSize()), []);
  const update = (s: WidgetSize) => {
    setSize(s);
    try {
      window.localStorage.setItem(SIZE_KEY, s);
    } catch {
      /* private mode / disabled storage — size just won't persist */
    }
  };
  return [size, update];
}

/** The card itself — always w-full (fills whatever wrapper hosts it). Theme-preset
 *  colours + radius; a size menu on right-click AND on the header ⚙ button. */
function ResumeCard({ size, setSize }: { size: WidgetSize; setSize: (s: WidgetSize) => void }) {
  const recents = useResumeCourses();
  const menu = useContextMenu();

  const sizeItems: MenuItem[] = (["s", "m", "l"] as WidgetSize[]).map((k) => ({
    label: `${SIZE_LABEL[k]} · ${k.toUpperCase()}`,
    icon: size === k ? Check : undefined,
    onClick: () => setSize(k),
  }));
  const shown = recents.slice(0, SIZE_ITEMS[size]);

  return (
    <div
      onContextMenu={(e) => menu.open(e)}
      className="w-full rounded-[var(--radius-win)] border border-border bg-[var(--glass-menu)] p-3.5 text-card-foreground shadow-xl backdrop-blur-xl"
    >
      <div className="mb-2.5 flex items-center gap-2">
        <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-[12.5px] font-semibold">Lanjutkan belajar</span>
        <span className="ml-auto text-[12.5px] font-bold tabular-nums text-primary">
          {recents.length || ""}
        </span>
        <button
          type="button"
          onClick={(e) => menu.open(e)}
          aria-label="Ukuran widget (klik kanan juga bisa)"
          className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <SlidersHorizontal className="size-3.5" aria-hidden />
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="text-[11.5px] text-muted-foreground">
          Buka sebuah kelas untuk mulai melacak progres.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {shown.map((c) => (
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

      <ContextMenu pos={menu.pos} items={sizeItems} onClose={menu.close} />
    </div>
  );
}

/** desktopWidgets slot (macOS + Windows): the slot has NO wrapper, so this MUST
 *  self-position. Top-right, behind the window layer (z-[5]); the column width is
 *  the S/M/L size (the card inside is w-full). top-12 clears the macOS menu bar and
 *  sits above the Windows taskbar. */
function DesktopProgressWidget() {
  const [size, setSize] = useWidgetSize();
  return (
    <div className={cn("absolute right-4 top-12 z-[5] flex flex-col", SIZE_WIDTH[size])}>
      <ResumeCard size={size} setSize={setSize} />
    </div>
  );
}

/** today slot (iOS + Android + Dashboard): in-flow, full width; the host container
 *  gives the height. shrink-0 so a flex column (Android home) never squishes it. */
function MobileProgressWidget() {
  const [size, setSize] = useWidgetSize();
  return (
    <div className="w-full shrink-0 p-4">
      <ResumeCard size={size} setSize={setSize} />
    </div>
  );
}

// Fills BOTH widget slots so the resume card shows in every shell: today (mobile /
// android / dashboard) + desktopWidgets (macOS / windows). Reuses the "widgets" id
// so it drops in where appshell's (filtered-out) default widget feature did.
export const learningWidgetsFeature = defineFeature({
  id: "widgets",
  kind: "custom",
  slots: { today: MobileProgressWidget, desktopWidgets: DesktopProgressWidget },
});
