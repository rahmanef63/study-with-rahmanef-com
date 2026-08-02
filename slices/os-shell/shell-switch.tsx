"use client";
// Quick "switch OS look" control — swap the desktop shell (macOS / Windows /
// Dashboard) in one tap instead of digging into Pengaturan. Fills the
// `menuBarStatus` slot, so the SAME button shows up in the macOS menu bar, the
// Dashboard sidebar dock, and the Windows taskbar tray (which mounts that slot).
//
// menuBarStatus is a DESKTOP-only region, so this always switches the desktop
// surface — honest: on a wide screen only desktop shells actually render (the
// live form factor picks the surface). Mobile shells (iOS/Android) are switched
// from the Control Center tile on a phone. Reuses the shell registry API; no new
// state (setShell persists + live-switches).
import { ChevronsUpDown, Check } from "lucide-react";
import { defineFeature, useShellPrefs, setShell, shellsForSurface } from "@/features/appshell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function ShellSwitch() {
  const prefs = useShellPrefs();
  const shells = shellsForSurface("desktop");
  const current = shells.find((s) => s.id === prefs.desktop) ?? shells[0];
  if (!current || shells.length < 2) return null;
  const Icon = current.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          aria-label={`Tampilan OS: ${current.label}`}
          className="h-auto flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-normal text-muted-foreground hover:bg-[var(--hover-strong)] hover:text-foreground"
        >
          <Icon className="size-3.5 shrink-0" />
          <span className="max-w-20 truncate">{current.label}</span>
          <ChevronsUpDown className="size-3 shrink-0 opacity-60" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-52 p-1">
        <p className="px-2 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Tampilan OS
        </p>
        {shells.map((s) => {
          const active = s.id === prefs.desktop;
          const SIcon = s.icon;
          return (
            <Button
              key={s.id}
              type="button"
              variant="ghost"
              onClick={() => setShell("desktop", s.id)}
              aria-pressed={active}
              className={cn(
                "h-auto w-full justify-start gap-2 px-2 py-1.5 text-sm font-normal",
                active ? "bg-primary/10 text-primary" : "hover:bg-accent/50",
              )}
            >
              <SIcon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate text-left">{s.label}</span>
              {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
            </Button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}

// Fills the desktop status cluster (macOS menu bar + Dashboard dock + Windows tray).
export const shellSwitchFeature = defineFeature({
  id: "shell-switch",
  kind: "custom",
  slots: { menuBarStatus: ShellSwitch },
});
