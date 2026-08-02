"use client";
/* Dashboard shell pieces — sidebar rows + the Home overview. Split from
   dashboard-shell.tsx to keep both under the 200-line rule; only the Dashboard
   shell composes these. The Home overview follows the "Design Platform Wireframe"
   IA — centered hero + command search + quick-action row + a right rail — rebuilt
   in this app's tokens (mockup-kit). Stats cards read the optional useSystemStats
   capability and simply don't render without it. */
import { useMemo, useState } from "react";
import { X, Cpu, MemoryStick, HardDrive, Pin, PinOff, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero, CommandSearch, QuickActionRow, SectionHeader, StatTile } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { useSystemStats } from "../../../registry/capabilities";
import type { AppDescriptor } from "../../../lib/types";
import { AppIcon } from "../../app-icon";
import { Slot } from "../../../registry/feature-registry"; // [study-with fork] today widget below
import { ContextMenu, useContextMenu } from "../context-menu"; // [study-with fork] pin toggle
import { usePins, togglePin } from "@/features/os-shell/pins";

export function DashboardHome({ apps, onOpenApp }: { apps: AppDescriptor[]; onOpenApp: (app: AppDescriptor) => void }) {
  const stats = useSystemStats();
  const monitor = apps.find((a) => a.id === "system-monitor");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (q ? apps.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())) : apps),
    [apps, q],
  );
  const pinned = filtered.filter((a) => !a.noDock);
  const contextual = filtered.filter((a) => a.noDock);
  const quick = apps.filter((a) => !a.noDock).slice(0, 8);
  const cards = stats
    ? [
        { icon: Cpu, label: "CPU", value: `${Math.round(stats.cpu.pct)}%`, hint: `${stats.cpu.cores} cores` },
        { icon: MemoryStick, label: "Memory", value: `${Math.round((stats.mem.used / stats.mem.total) * 100)}%`, hint: fmtGb(stats.mem.used) + " / " + fmtGb(stats.mem.total) },
        { icon: HardDrive, label: "Disk", value: `${Math.round((stats.disk.used / stats.disk.total) * 100)}%`, hint: fmtGb(stats.disk.used) + " / " + fmtGb(stats.disk.total) },
      ]
    : [];

  return (
    <div className="h-full w-full overflow-auto p-5 @md:p-8">
      <Hero
        align="center"
        eyebrow="Ruang belajarmu"
        title="Mau belajar apa hari ini?"
        description="Semua komunitas, kelas, dan progresmu dalam satu panel."
      >
        <CommandSearch
          value={q}
          onChange={setQ}
          onSubmit={() => filtered.length === 1 && onOpenApp(filtered[0])}
          placeholder="Cari aplikasi & ruang…"
        />
        <div className="mt-5">
          <QuickActionRow
            items={quick.map((a) => ({
              id: a.id,
              icon: <span className="size-6"><AppIcon app={a} /></span>,
              label: a.title,
              onClick: () => onOpenApp(a),
            }))}
          />
        </div>
      </Hero>

      {/* content + right rail (the mockup's docked panel — real content, not a fake AI box) */}
      <div className="mt-8 grid gap-8 @4xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0 space-y-8">
          {pinned.length > 0 && (
            <div>
              <SectionHeader title="Aplikasi" />
              <AppGrid apps={pinned} onOpenApp={onOpenApp} />
            </div>
          )}
          {contextual.length > 0 && (
            <div>
              <SectionHeader
                title="Fitur lain"
                actions={<span className="text-xs text-muted-foreground">Dibuka dari komunitas atau kelas</span>}
              />
              <AppGrid apps={contextual} onOpenApp={onOpenApp} />
            </div>
          )}
          {filtered.length === 0 && (
            <p className="rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
              Tidak ada aplikasi cocok “{q}”.
            </p>
          )}
        </section>

        <aside className="space-y-6">
          {/* [study-with fork] the learning "today" widget, in the right rail (dashboard has no floating layer) */}
          <Slot region="today" />
          {cards.length > 0 && (
            <section className="space-y-3">
              <SectionHeader as="h3" title="Host" className="mb-3" />
              <div className="flex flex-col gap-3">
                {cards.map((c) => (
                  <StatTile
                    key={c.label}
                    icon={<c.icon className="size-5" />}
                    label={c.label}
                    value={c.value}
                    hint={c.hint}
                    onClick={monitor ? () => onOpenApp(monitor) : undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

/* A grid of app launch tiles — shared by the Home "Aplikasi" + "Fitur lain" groups.
   Right-click a tile to pin/unpin it ([study-with fork]: pinned apps become desktop
   icons on macOS/Windows). */
function AppGrid({ apps, onOpenApp }: { apps: AppDescriptor[]; onOpenApp: (app: AppDescriptor) => void }) {
  const menu = useContextMenu();
  const [target, setTarget] = useState<AppDescriptor | null>(null);
  const pinned = usePins();
  return (
    <div className="grid grid-cols-2 gap-4 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-5">
      {apps.map((a) => (
        <Button
          key={a.id}
          type="button"
          variant="ghost"
          onClick={() => onOpenApp(a)}
          onContextMenu={(e) => { setTarget(a); menu.open(e); }}
          className="flex h-auto flex-col items-start gap-1.5 rounded-[var(--radius-win)] border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-md"
        >
          <span className="size-10"><AppIcon app={a} /></span>
          <span className="mt-1.5 w-full truncate text-sm font-medium">{a.title}</span>
        </Button>
      ))}
      <ContextMenu
        pos={menu.pos}
        items={
          target
            ? [{
                label: pinned.includes(target.id) ? "Lepas dari desktop" : "Sematkan ke desktop",
                icon: pinned.includes(target.id) ? PinOff : Pin,
                onClick: () => { togglePin(target.id); menu.close(); },
              }]
            : []
        }
        onClose={menu.close}
      />
    </div>
  );
}

export function NavItem({ active, onClick, icon, label, inline }: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  /** Breadcrumb mode: bare text button instead of a full-width sidebar row. */
  inline?: boolean;
}) {
  if (inline) {
    return (
      <Button type="button" variant="ghost" onClick={onClick}
        className="h-auto p-0 text-sm font-normal text-muted-foreground hover:bg-transparent hover:text-foreground">
        {label}
      </Button>
    );
  }
  return (
    <Button
      type="button"
      variant="ghost"
      onClick={onClick}
      className={cn(
        "h-auto w-full justify-start gap-2.5 rounded-md px-2.5 py-2 text-sm font-normal",
        active
          ? "bg-primary/15 font-semibold text-primary"
          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Button>
  );
}

/* [study-with fork] A collapsible sidebar group (SSOT: os-shell/nav-groups) — the
   "normal dashboard" grouped nav that replaced the flat, triple-listed app dump.
   Header toggles the group; each app row shows a macOS/Windows-style "running" dot
   when its window is open (→ close ✕ on hover/touch), replacing the Running list. */
export function CollapsibleGroup({ label, apps, activeAppId, openApps, open, onToggle, onActivate, onClose }: {
  label: string;
  apps: AppDescriptor[];
  activeAppId: string | null;
  /** App ids that currently have a window open (drives the running dot). */
  openApps: Set<string>;
  open: boolean;
  onToggle: () => void;
  onActivate: (app: AppDescriptor) => void;
  onClose: (app: AppDescriptor) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center gap-1.5 px-4 pb-1 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight className={cn("size-3 shrink-0 transition-transform", open && "rotate-90")} />
        <span className="truncate">{label}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-0.5 px-2">
          {apps.map((a) => (
            <GroupAppRow
              key={a.id}
              app={a}
              active={activeAppId === a.id}
              running={openApps.has(a.id)}
              onActivate={() => onActivate(a)}
              onClose={() => onClose(a)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* One app row: click activates (launch, or resume if already open). When its
   window is open it shows a "running" dot (macOS/Windows) that becomes a close ✕
   on hover/touch — the only close affordance in the single-pane Dashboard shell. */
function GroupAppRow({ app, active, running, onActivate, onClose }: {
  app: AppDescriptor;
  active: boolean;
  running: boolean;
  onActivate: () => void;
  onClose: () => void;
}) {
  return (
    <div className={cn("group/row flex items-center rounded-md", active ? "bg-primary/15" : "hover:bg-sidebar-accent")}>
      <Button
        type="button"
        variant="ghost"
        onClick={onActivate}
        className={cn(
          "h-auto min-w-0 flex-1 justify-start gap-2.5 px-2.5 py-2 text-sm font-normal hover:bg-transparent",
          active ? "font-semibold text-primary" : "text-sidebar-foreground hover:text-foreground",
        )}
      >
        <span className="size-5 shrink-0"><AppIcon app={app} /></span>
        <span className="truncate">{app.title}</span>
      </Button>
      {running && (
        <span className="relative mr-1.5 grid size-6 shrink-0 place-items-center">
          <span
            className={cn(
              "size-1.5 rounded-full bg-primary transition-opacity group-hover/row:opacity-0 pointer-coarse:opacity-0",
              !active && "bg-primary/70",
            )}
            aria-hidden
          />
          <button
            type="button"
            aria-label={`Tutup ${app.title}`}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="absolute inset-0 hidden place-items-center rounded text-muted-foreground hover:text-foreground group-hover/row:grid pointer-coarse:grid"
          >
            <X className="size-3.5" />
          </button>
        </span>
      )}
    </div>
  );
}

function fmtGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
