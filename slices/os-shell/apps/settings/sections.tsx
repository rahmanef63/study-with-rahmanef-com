"use client";

import { ChevronRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useActiveShell } from "@/features/appshell";
import { ThemePresetGallery } from "@/features/theme-presets";
import { cn } from "@/lib/utils";
import { SECTIONS, type SectionId } from "./nav";
import { ShellSection } from "./shell-section";
import { AkunSection, ProfilSection } from "./account-sections";
import { AboutSection } from "./about-section";

// The section content — one panel per SectionId, shared verbatim by every shell's
// Settings layout (the per-shell seam only swaps the nav chrome around these,
// never the bodies). Bodies are REUSED views; the section heading lives in
// SectionDetail so the panels don't repeat it.
function SectionBody({ id }: { id: SectionId }) {
  switch (id) {
    case "tampilan":
      return <ThemePresetGallery />;
    case "shell":
      return <ShellSection />;
    case "akun":
      return <AkunSection />;
    case "profil":
      return (
        <div className="w-full max-w-2xl">
          <ProfilSection />
        </div>
      );
    case "tentang":
      return <AboutSection />;
  }
}

// One scrolling section pane with its heading, adapting per shell: on phones a bold
// iOS/Android large title (distinct from the shell nav bar's app title); on
// macOS/Windows a compact title + blurb above the same shared body.
export function SectionDetail({ id }: { id: SectionId }) {
  const { id: shellId, surface } = useActiveShell();
  const isPhone = surface === "mobile";
  const meta = SECTIONS.find((s) => s.id === id);
  return (
    <ScrollArea className="h-full">
      <div
        data-slot="settings-pane"
        className="mx-auto min-w-0 max-w-3xl space-y-4 overflow-x-hidden p-3 pb-[max(1rem,var(--sai-bottom,0px))] sm:space-y-5 sm:p-5"
      >
        {meta &&
          (isPhone ? (
            <h1
              className={cn(
                "px-1 pt-1 leading-none",
                shellId === "ios" ? "text-[32px] font-extrabold tracking-[-0.02em] pb-1" : "text-[26px] font-bold tracking-tight",
              )}
            >
              {meta.label}
            </h1>
          ) : (
            <header className="space-y-0.5">
              <h2 className={cn("leading-tight", shellId === "macos" ? "text-[22px] font-bold tracking-tight" : "text-sm font-semibold")}>
                {meta.label}
              </h2>
              <p className="text-xs text-muted-foreground">{meta.blurb}</p>
            </header>
          ))}
        <SectionBody id={id} />
      </div>
    </ScrollArea>
  );
}

// Mobile section index — iOS System Settings: colored icon tiles in grouped rounded
// cards, single-line rows with a trailing chevron, hairline separators inset to the
// label. Tapping a row drills the MasterDetail into the section; the back arrow
// returns here. No in-pane large title — the mobile app-chrome header already paints
// "Pengaturan" (avoids a double title).
export function SectionList({ active, onSelect }: { active: SectionId | null; onSelect: (id: SectionId) => void }) {
  const { id: shellId } = useActiveShell();
  const ios = shellId === "ios";
  // Grouped cards bucketed by each section's semantic `group` — reorder-safe, unlike
  // an index slice. Consecutive same-group sections share a card.
  const groups = SECTIONS.reduce<(typeof SECTIONS)[number][][]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last[0].group === s.group) last.push(s);
    else acc.push([s]);
    return acc;
  }, []);
  return (
    <div
      role="tablist"
      aria-label="Bagian pengaturan"
      data-slot="settings-pane"
      className={cn("mx-auto min-h-full max-w-2xl bg-muted/25 p-4 pb-[max(1rem,var(--sai-bottom,0px))]", ios ? "space-y-[18px]" : "space-y-6")}
    >
      {groups.map((group, gi) => (
        <div key={gi} data-slot="settings-card" className="overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm">
          {group.map((s) => {
            const Icon = s.icon;
            const on = s.id === active;
            return (
              <button
                key={s.id}
                type="button"
                role="tab"
                aria-selected={on}
                data-slot="settings-row"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "relative flex w-full items-center gap-3 px-4 text-left transition-colors",
                  ios ? "min-h-[46px] py-[11px]" : "py-2.5",
                  "after:absolute after:inset-x-0 after:bottom-0 after:left-[3.5rem] after:h-px after:bg-border/60 last:after:hidden",
                  on ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span
                  className="grid size-[29px] shrink-0 place-items-center rounded-[7px] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
                  style={{ background: s.color }}
                >
                  <Icon className="size-[17px] text-white" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[16px] font-medium leading-tight">{s.label}</span>
                <ChevronRight className={cn("shrink-0", ios ? "size-[15px] text-muted-foreground/40" : "size-[18px] text-muted-foreground/45")} />
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
