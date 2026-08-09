"use client";

// Light / dark / system switch. The OS shell carried this in its menu bar; with
// the shell gone, Pengaturan is the only place it lives.
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES = [
  { id: "light", label: "Terang", Icon: Sun },
  { id: "dark", label: "Gelap", Icon: Moon },
  { id: "system", label: "Ikut sistem", Icon: Monitor },
] as const;

export function PengaturanTampilan() {
  const { theme, setTheme } = useTheme();
  // next-themes only knows the resolved mode after mount; rendering the active
  // state before that would hydrate-mismatch against the prerendered HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div
      role="radiogroup"
      aria-label="Mode tampilan"
      className="grid max-w-md grid-cols-3 gap-1 rounded-xl border bg-muted/50 p-1"
    >
      {MODES.map(({ id, label, Icon }) => {
        const active = mounted && (theme ?? "system") === id;
        return (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(id)}
            className={cn(
              "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        );
      })}
    </div>
  );
}
