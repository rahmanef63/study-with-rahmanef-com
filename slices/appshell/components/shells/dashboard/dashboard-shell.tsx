"use client";
/* Dashboard shell — a single-pane cockpit surface (no floating windows):
   sidebar + breadcrumb + content. Generic: brand comes from <BrandProvider>,
   host telemetry from the optional useSystemStats capability (the Home cards
   simply hide without it). It DRIVES the shared window store: launching calls
   openWindow, the pane shows the focused (or newest non-minimized) window via
   <WindowContent>, Home minimizes it — so UrlSync deep links work here and
   open windows (with their payloads) carry over intact when switching to the
   macOS/Windows/mobile shells. */
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, Activity, Search } from "lucide-react";
import { registerShell } from "../../../registry/shells";
import { useShellConfig } from "../../../registry/shell-config";
import { useBrand } from "../../../registry/brand";
import { useApps } from "../../../lib/registry";
import { useWindowOrder, useFocused, useWindow } from "../../../hooks/use-shell";
import { shellStore, openWindow, minimizeWindow, restoreWindow } from "../../../lib/store";
import type { AppDescriptor } from "../../../lib/types";
import { AppIcon } from "../../app-icon";
import { WindowContent } from "../../window-content";
import { Slot } from "../../../registry/feature-registry"; // [study-with fork] rightPanel below
import { DashboardHome, NavItem, RunningRow, SidebarLabel } from "./dashboard-parts";

function DashboardShell() {
  const brand = useBrand();
  const allApps = useApps();
  // Show EVERY feature in the Dashboard (like the macOS Launchpad / iOS home) —
  // only the auth flow (masuk) is hidden (it's reached via the account control).
  // Contextual (noDock) apps open to a friendly "pick a community/class" state.
  const apps = allApps.filter((a) => a.id !== "masuk");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => apps.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())),
    [apps, q],
  );

  // URL → view, same derivation as the mobile shell: a pathname naming an app
  // slug shows the app pane (UrlSync opens/focuses its window in the shared
  // store), anything else shows Home. User gestures override, keyed to the
  // pathname they were made at, so the derivation wins again when the URL
  // actually changes — no effect-driven setState.
  const { routing } = useShellConfig();
  const pathname = usePathname();
  const urlSlug = pathname.split("/").filter(Boolean)[0];
  const urlIsApp =
    routing !== false && !!urlSlug && allApps.some((a) => (a.slug ?? a.id) === urlSlug);
  const [homeChoice, setHomeChoice] = useState<{ key: string; home: boolean } | null>(null);
  const home = homeChoice?.key === pathname ? homeChoice.home : !urlIsApp;
  const setHome = (h: boolean) => setHomeChoice({ key: pathname, home: h });

  // The pane shows the FOCUSED window — fall back to the newest non-minimized
  // one (`order` is append-only and doesn't track focus).
  const order = useWindowOrder();
  const focused = useFocused();
  const topId =
    focused && !shellStore.getWindow(focused)?.minimized
      ? focused
      : ([...order].reverse().find((id) => !shellStore.getWindow(id)?.minimized) ?? null);
  const top = useWindow(topId ?? "__none__"); // reactive: re-renders on the active window's payload/title changes
  const pane = !home && top ? top : null;

  // SSOT navigation: open / resume bring a window to the front; Home minimizes.
  const launch = (app: AppDescriptor) => {
    openWindow(app.id, app.title, app.defaultSize, undefined, { multi: app.multi });
    setHome(false);
  };
  const resume = (id: string) => {
    restoreWindow(id);
    setHome(false);
  };
  const goHome = () => {
    if (topId) minimizeWindow(topId);
    setHome(true);
  };

  return (
    <div className="absolute inset-0 z-[10] flex bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="flex h-14 shrink-0 items-center gap-2.5 px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold uppercase text-primary-foreground">
            {brand.name.slice(0, 1)}
          </span>
          <span className="truncate text-sm font-semibold">{brand.name}</span>
        </div>

        <div className="flex flex-col gap-0.5 px-2">
          <NavItem active={!pane} onClick={goHome} icon={<Home className="size-4" />} label="Home" />
        </div>

        {order.length > 0 && (
          <>
            <SidebarLabel>Running</SidebarLabel>
            <div className="flex flex-col gap-0.5 px-2">
              {order.map((id) => (
                <RunningRow key={id} id={id} active={pane?.id === id} onPick={() => resume(id)} />
              ))}
            </div>
          </>
        )}

        <SidebarLabel>Apps</SidebarLabel>
        <div className="px-2 pb-1.5">
          <div className="flex items-center gap-2 rounded-md border border-sidebar-border bg-background px-2.5 py-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter apps"
              className="w-full bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-auto px-2 pb-3">
          {filtered.map((a) => (
            <NavItem
              key={a.id}
              active={pane?.app === a.id}
              onClick={() => launch(a)}
              icon={<span className="size-5"><AppIcon app={a} /></span>}
              label={a.title}
            />
          ))}
          {filtered.length === 0 && (
            <div className="px-2.5 py-2 text-xs text-muted-foreground">No apps</div>
          )}
        </nav>

        {/* [study-with fork] sidebar dock (mockup's UserDock) — anchors the rail
            with the account control. Reuses the account feature's menuBarStatus
            filler (the only feature in that region) so no new slot/import edge. */}
        <div className="mt-auto flex items-center gap-2 border-t border-sidebar-border px-3 py-2.5">
          <Slot region="menuBarStatus" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-5 text-sm">
          <NavItem active={false} onClick={goHome} icon={null} label="Home" inline />
          {pane && (
            <>
              <span className="text-muted-foreground/50">/</span>
              <span className="font-medium">{pane.title}</span>
            </>
          )}
        </header>
        {/* container context is REQUIRED: app @container styles never match without it */}
        <main className="min-h-0 flex-1 overflow-hidden [container-type:inline-size]">
          {pane ? (
            <WindowContent key={pane.id} app={pane.app} payload={pane.payload} winId={pane.id} />
          ) : (
            <DashboardHome apps={apps} onOpenApp={launch} />
          )}
        </main>
      </div>
      {/* [study-with fork] Inspector (rightPanel) — mirrors desktop.tsx:157 so the
          Dashboard shell gets the Kelas inspector (progress/next/quiz/share/AI). The
          panel self-positions (absolute right-0), so this flex sibling is inert. */}
      <Slot region="rightPanel" />
    </div>
  );
}

registerShell({
  id: "dashboard",
  label: "Dashboard",
  icon: Activity,
  surface: "desktop",
  group: "Desktop",
  wallpaper: "graphite",
  render: DashboardShell,
});

export { DashboardShell };
