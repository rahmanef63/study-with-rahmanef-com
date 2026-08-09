"use client";

import { shellsForSurface, useShellPrefs, setShell } from "@/features/appshell";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Tampilan OS — per-surface shell picker (desktop + mobile chosen independently).
// Uses appshell's shell registry (setShell persists to localStorage; live switch).
// Relocated verbatim from the old flat pengaturan-app.
export function ShellSection() {
  const prefs = useShellPrefs();
  const rows: { surface: "desktop" | "mobile"; label: string; hint: string }[] = [
    { surface: "desktop", label: "Layar lebar", hint: "Desktop" },
    { surface: "mobile", label: "Layar sentuh", hint: "Mobile" },
  ];
  return (
    <div className="space-y-6">
      {rows.map(({ surface, label, hint }) => (
        <div key={surface} className="space-y-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium">{label}</span>
            <span className="eyebrow">{hint}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 @md:grid-cols-3 @xl:grid-cols-4 @2xl:grid-cols-5">
            {shellsForSurface(surface).map((s) => {
              const active = prefs[surface] === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setShell(surface, s.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-11 items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary/50 bg-primary/10 text-primary"
                      : "border-border hover:bg-accent/40",
                  )}
                >
                  <span className="min-w-0 truncate font-medium">{s.label}</span>
                  {active ? <Check className="size-4 shrink-0" aria-hidden /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <p className="text-xs text-muted-foreground">
        Ganti gaya OS — macOS, Windows, Android, iOS, atau Dasbor. Berlaku langsung.
      </p>
    </div>
  );
}
