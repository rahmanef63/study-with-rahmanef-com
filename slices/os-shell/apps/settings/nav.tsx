"use client";

import type { ComponentType } from "react";
import { CircleUser, Info, MonitorSmartphone, Palette, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

// Section identity — Indonesian labels (UI copy = Bahasa Indonesia, AGENTS §7).
export type SectionId = "tampilan" | "shell" | "akun" | "profil" | "tentang";

// Semantic buckets for the mobile grouped index. Reorder-safe: the mobile cards
// derive from THIS field, not an index slice, so reordering can't re-bucket a row.
export type SettingsGroup = "personalisasi" | "akun" | "sistem";

// Per-category tile colors — fixed like macOS System Settings' category glyphs (a
// category keeps its hue in dark mode). Intentionally NOT theme tokens; this
// mirrors the raw-value precedent in AppDescriptor.gradient (a glyph-color registry).
export const SECTIONS: ReadonlyArray<{
  id: SectionId;
  label: string;
  blurb: string;
  icon: ComponentType<{ className?: string }>;
  color: string;
  group: SettingsGroup;
}> = [
  { id: "tampilan", label: "Tampilan", blurb: "Tema dan warna aksen", icon: Palette, color: "#ff375f", group: "personalisasi" },
  { id: "shell", label: "Tampilan OS", blurb: "Gaya desktop dan sentuh", icon: MonitorSmartphone, color: "#0a84ff", group: "personalisasi" },
  { id: "akun", label: "Akun", blurb: "Sesi masuk dan keluar", icon: CircleUser, color: "#30d158", group: "akun" },
  { id: "profil", label: "Profil", blurb: "Nama, username, dan bio", icon: UserRound, color: "#bf5af2", group: "akun" },
  { id: "tentang", label: "Tentang", blurb: "Info sistem dan reset", icon: Info, color: "#8e8e93", group: "sistem" },
];

// Windows / Dashboard top tab strip: every section visible at a glance, scrolls
// horizontally when the window is too narrow. Active tab fills with the accent.
export function SettingsTabs({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  return (
    <nav
      role="tablist"
      aria-label="Pengaturan"
      className="flex gap-1 overflow-x-auto p-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      {SECTIONS.map(({ id, label, blurb, icon: Icon }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            title={blurb}
            onClick={() => onSelect(id)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium leading-none transition-colors min-h-9",
              on ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" />
            <span>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// macOS System Settings sidebar: a vertical category list with fixed colored glyph
// tiles (Apple's category convention). Same SECTIONS, same onSelect — only the
// presentation differs from the tab strip. Active row fills the accent.
export function SettingsSidebar({ active, onSelect }: { active: SectionId; onSelect: (id: SectionId) => void }) {
  return (
    <nav role="tablist" aria-label="Bagian pengaturan" className="flex h-full flex-col gap-0.5 overflow-y-auto p-2">
      {SECTIONS.map(({ id, label, blurb, icon: Icon, color }) => {
        const on = id === active;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            title={blurb}
            onClick={() => onSelect(id)}
            className={cn(
              "flex min-h-9 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] font-medium leading-tight transition-colors",
              on ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
            )}
          >
            <span
              className="grid size-[26px] shrink-0 place-items-center rounded-[7px] shadow-[0_1px_2px_rgba(0,0,0,0.25)]"
              style={{ background: color }}
            >
              <Icon className="size-[15px] text-white" />
            </span>
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
