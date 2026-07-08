"use client";
/* Dashboard shell pieces — sidebar rows + the Home overview. Split from
   dashboard-shell.tsx to keep both under the 200-line rule; only the Dashboard
   shell composes these. The Home overview follows the "Design Platform Wireframe"
   IA — centered hero + command search + quick-action row + a right rail — rebuilt
   in this app's tokens (mockup-kit). Stats cards read the optional useSystemStats
   capability and simply don't render without it. */
import { useMemo, useState } from "react";
import { X, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero, CommandSearch, QuickActionRow, SectionHeader, StatTile } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { useApps } from "../../../lib/registry";
import { useWindow } from "../../../hooks/use-shell";
import { closeWindow } from "../../../lib/store";
import { useSystemStats } from "../../../registry/capabilities";
import type { AppDescriptor } from "../../../lib/types";
import { AppIcon } from "../../app-icon";
import { Slot } from "../../../registry/feature-registry"; // [study-with fork] today widget below

export function DashboardHome({ apps, onOpenApp }: { apps: AppDescriptor[]; onOpenApp: (app: AppDescriptor) => void }) {
  const stats = useSystemStats();
  const monitor = apps.find((a) => a.id === "system-monitor");
  const [q, setQ] = useState("");
  const filtered = useMemo(
    () => (q ? apps.filter((a) => a.title.toLowerCase().includes(q.toLowerCase())) : apps),
    [apps, q],
  );
  const quick = apps.slice(0, 8);
  const cards = stats
    ? [
        { icon: Cpu, label: "CPU", value: `${Math.round(stats.cpu.pct)}%`, hint: `${stats.cpu.cores} cores` },
        { icon: MemoryStick, label: "Memory", value: `${Math.round((stats.mem.used / stats.mem.total) * 100)}%`, hint: fmtGb(stats.mem.used) + " / " + fmtGb(stats.mem.total) },
        { icon: HardDrive, label: "Disk", value: `${Math.round((stats.disk.used / stats.disk.total) * 100)}%`, hint: fmtGb(stats.disk.used) + " / " + fmtGb(stats.disk.total) },
      ]
    : [];

  return (
    <div className="mx-auto h-full max-w-6xl overflow-auto p-5 @md:p-8">
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
        <section className="min-w-0">
          <SectionHeader title="Semua aplikasi" />
          <div className="grid grid-cols-2 gap-4 @sm:grid-cols-3 @lg:grid-cols-4">
            {filtered.map((a) => (
              <Button
                key={a.id}
                type="button"
                variant="ghost"
                onClick={() => onOpenApp(a)}
                className="flex h-auto flex-col items-start gap-1.5 rounded-[var(--radius-win)] border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card hover:shadow-md"
              >
                <span className="size-10"><AppIcon app={a} /></span>
                <span className="mt-1.5 w-full truncate text-sm font-medium">{a.title}</span>
              </Button>
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full rounded-[var(--radius-win)] border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
                Tidak ada aplikasi cocok “{q}”.
              </p>
            )}
          </div>
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

/* A sidebar row for an OPEN window: click resumes (restore + focus), the ✕
   closes it in the shared store — exactly the taskbar/dock affordances. */
export function RunningRow({ id, active, onPick }: { id: string; active: boolean; onPick: () => void }) {
  const win = useWindow(id);
  const apps = useApps();
  if (!win) return null;
  const app = apps.find((a) => a.id === win.app);
  return (
    <div className={cn("group flex items-center rounded-md", active ? "bg-sidebar-accent" : "hover:bg-sidebar-accent/60")}>
      <Button
        type="button"
        variant="ghost"
        onClick={onPick}
        className={cn(
          "h-auto min-w-0 flex-1 justify-start gap-2.5 px-2.5 py-2 text-sm font-normal hover:bg-transparent",
          active ? "font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
        )}
      >
        {app && <span className="size-5 shrink-0"><AppIcon app={app} /></span>}
        <span className="truncate">{win.title}</span>
      </Button>
      <Button type="button" variant="ghost" size="icon"
        aria-label={`Close ${win.title}`}
        onClick={() => closeWindow(id)}
        className="mr-1 size-6 shrink-0 rounded text-muted-foreground opacity-0 hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100 pointer-coarse:opacity-100"
      >
        <X className="size-3.5" />
      </Button>
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
          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      {icon}
      <span className="truncate">{label}</span>
    </Button>
  );
}

export function SidebarLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-4 pb-1.5 pt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </div>
  );
}

function fmtGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
