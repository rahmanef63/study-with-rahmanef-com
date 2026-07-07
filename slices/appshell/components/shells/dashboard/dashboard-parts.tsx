"use client";
/* Dashboard shell pieces — sidebar rows + the Home overview (host stats + app
   grid). Split from dashboard-shell.tsx to keep both under the 200-line rule;
   only the Dashboard shell composes these. Stats cards read the optional
   useSystemStats capability and simply don't render without it. */
import { X, Cpu, MemoryStick, HardDrive } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const cards = stats
    ? [
        { icon: Cpu, label: "CPU", value: `${Math.round(stats.cpu.pct)}%`, hint: `${stats.cpu.cores} cores` },
        { icon: MemoryStick, label: "Memory", value: `${Math.round((stats.mem.used / stats.mem.total) * 100)}%`, hint: fmtGb(stats.mem.used) + " / " + fmtGb(stats.mem.total) },
        { icon: HardDrive, label: "Disk", value: `${Math.round((stats.disk.used / stats.disk.total) * 100)}%`, hint: fmtGb(stats.disk.used) + " / " + fmtGb(stats.disk.total) },
      ]
    : [];

  return (
    <div className="mx-auto h-full max-w-6xl overflow-auto px-8 py-7">
      <h1 className="mb-1 text-xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mb-8 text-sm text-muted-foreground">Everything in one pane.</p>

      {/* [study-with fork] the learning "today" widget, in-flow (dashboard has no floating layer) */}
      <div className="mb-9 max-w-sm">
        <Slot region="today" />
      </div>

      {cards.length > 0 && (
        <Section title="Host">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((c) => (
              <Button
                key={c.label}
                type="button"
                variant="ghost"
                onClick={() => monitor && onOpenApp(monitor)}
                className="flex h-auto items-center justify-start gap-3.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-md"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><c.icon className="size-5" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{c.label} · {c.value}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.hint}</span>
                </span>
              </Button>
            ))}
          </div>
        </Section>
      )}

      <Section title="Apps">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {apps.map((a) => (
            <Button
              key={a.id}
              type="button"
              variant="ghost"
              onClick={() => onOpenApp(a)}
              className="flex h-auto flex-col items-start gap-1.5 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-card hover:shadow-md"
            >
              <span className="size-10"><AppIcon app={a} /></span>
              <span className="mt-1.5 w-full truncate text-sm font-medium">{a.title}</span>
            </Button>
          ))}
        </div>
      </Section>
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
    <div className={cn("group flex items-center rounded-md", active ? "bg-primary/10" : "hover:bg-muted")}>
      <Button
        type="button"
        variant="ghost"
        onClick={onPick}
        className={cn(
          "h-auto min-w-0 flex-1 justify-start gap-2.5 px-2.5 py-2 text-sm font-normal hover:bg-transparent",
          active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
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
        active ? "bg-primary/10 font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-9">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </section>
  );
}

function fmtGb(bytes: number): string {
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}
