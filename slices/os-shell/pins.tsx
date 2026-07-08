"use client";
// User "pin" system — pin an app to keep it one tap away. A pinned app shows as
// a DESKTOP ICON on macOS/Windows (via the desktopWidgets slot) and a "Favorit"
// row in the Dashboard sidebar. Pins are per-user + client-side (localStorage
// `swr:pinned-apps`) — no Convex. A module store (useSyncExternalStore, same
// shape as appshell's shell prefs) keeps every mount point — desktop grid,
// sidebar, right-click toggle — in sync live.
import { useSyncExternalStore } from "react";
import { PinOff } from "lucide-react";
import { defineFeature, useApps, openWindow, AppIcon, type AppDescriptor } from "@/features/appshell";
import { ContextMenu, useContextMenu } from "@/features/appshell/components/shells/context-menu";

const KEY = "swr:pinned-apps";
const EMPTY: string[] = [];
let pins: string[] = load();
const subs = new Set<() => void>();

function load(): string[] {
  if (typeof localStorage === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? (JSON.parse(raw) as unknown) : null;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : EMPTY;
  } catch {
    return EMPTY;
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(pins));
  } catch {
    /* private mode — pins just won't persist */
  }
  subs.forEach((f) => f());
}

/** Pin/unpin an app id. */
export function togglePin(id: string) {
  pins = pins.includes(id) ? pins.filter((p) => p !== id) : [...pins, id];
  persist();
}

/** Reactive list of pinned app ids (in pin order). */
export function usePins(): string[] {
  return useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => {
        subs.delete(cb);
      };
    },
    () => pins,
    () => EMPTY,
  );
}

/** Reactive pinned ids resolved to live AppDescriptors (unknown ids dropped). */
export function usePinnedApps(): AppDescriptor[] {
  const ids = usePins();
  const apps = useApps();
  return ids
    .map((id) => apps.find((a) => a.id === id))
    .filter((a): a is AppDescriptor => Boolean(a));
}

const launch = (a: AppDescriptor) =>
  openWindow(a.id, a.title, a.defaultSize, undefined, { multi: a.multi });

/** One desktop shortcut (macOS/Windows wallpaper layer): icon + white label,
 *  click launches, right-click unpins. */
function DesktopIcon({ app }: { app: AppDescriptor }) {
  const menu = useContextMenu();
  return (
    <>
      <button
        type="button"
        onClick={() => launch(app)}
        onContextMenu={(e) => menu.open(e)}
        title={app.title}
        className="group flex w-full flex-col items-center gap-1 rounded-lg p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="size-12 transition-transform group-hover:scale-105 group-active:scale-95">
          <AppIcon app={app} />
        </span>
        <span className="max-w-full truncate rounded px-1 text-[11px] font-medium text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
          {app.title}
        </span>
      </button>
      <ContextMenu
        pos={menu.pos}
        items={[{ label: "Lepas dari desktop", icon: PinOff, onClick: () => { togglePin(app.id); menu.close(); } }]}
        onClose={menu.close}
      />
    </>
  );
}

/** desktopWidgets slot (macOS + Windows): pinned apps as a top-left icon column
 *  behind the window layer. The slot has no wrapper, so this self-positions. */
function DesktopPins() {
  const pinned = usePinnedApps();
  if (pinned.length === 0) return null;
  return (
    <div className="absolute left-4 top-12 z-[5] flex w-20 flex-col gap-3">
      {pinned.map((app) => (
        <DesktopIcon key={app.id} app={app} />
      ))}
    </div>
  );
}

export const pinsFeature = defineFeature({
  id: "pins",
  kind: "custom",
  slots: { desktopWidgets: DesktopPins },
});
