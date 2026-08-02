"use client";

/** Settings gallery — every theme as a PREVIEW CARD rendered in that theme's own
 *  colours + sample text (independent of the active theme), so you see each
 *  palette before committing. Click a card to apply. The compact popover
 *  ThemePresetSwitcher stays for the header; this is the roomy settings view. */

import { useMemo } from "react";
import { useTheme } from "next-themes";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { groupTweakcnPresets, type TweakcnPresetGroup, type TweakcnPresetItem } from "../lib/tweakcn";
import { useThemePreset } from "./ThemePresetProvider";
import { ModeTabs, type ModeId } from "./mode-tabs";

// Editorial base (:root) is oklch; these hex are close enough for the preview
// swatch (the real base applies on select). name "" = the Default reset.
const DEFAULT_ITEM: TweakcnPresetItem = {
  name: "",
  title: "Default · Editorial",
  cssVars: {
    theme: { "font-sans": "'Hanken Grotesk', ui-sans-serif, system-ui, sans-serif", radius: "0.5rem" },
    light: {
      background: "#f4f1eb", foreground: "#2b2620", card: "#fbfaf6", primary: "#b65d38",
      "primary-foreground": "#faf6ef", border: "#e3ddd2", "muted-foreground": "#78706a",
      "chart-1": "#d97757", "chart-2": "#c79a6b", "chart-3": "#8fa68e", "chart-4": "#b0885f", "chart-5": "#6e6a62",
    },
    dark: {
      background: "#2a2724", foreground: "#eeebe4", card: "#322f2b", primary: "#d0895f",
      "primary-foreground": "#2a2724", border: "#48433d", "muted-foreground": "#aba398",
      "chart-1": "#e08a6b", "chart-2": "#cba97e", "chart-3": "#9db39b", "chart-4": "#c0996f", "chart-5": "#8a867e",
    },
  },
};

type Preview = {
  background: string; foreground: string; card: string; primary: string;
  primaryForeground: string; border: string; mutedForeground: string; charts: string[];
  // STATIC per theme — the preset's own font + radius, NOT the active theme's,
  // so a card never restyles when you pick another preset.
  fontSans: string; radius: string;
};

function extract(p: TweakcnPresetItem, dark: boolean): Preview {
  const v = (dark ? p.cssVars?.dark : p.cssVars?.light) ?? p.cssVars?.light ?? p.cssVars?.dark ?? {};
  const theme = p.cssVars?.theme ?? {};
  const primary = v.primary ?? "#888";
  return {
    background: v.background ?? "#ffffff",
    foreground: v.foreground ?? "#111111",
    card: v.card ?? v.background ?? "#ffffff",
    primary,
    primaryForeground: v["primary-foreground"] ?? "#ffffff",
    border: v.border ?? "#cccccc",
    mutedForeground: v["muted-foreground"] ?? v.foreground ?? "#666666",
    charts: [1, 2, 3, 4, 5].map((n) => v[`chart-${n}`] ?? primary),
    fontSans: theme["font-sans"] ?? "ui-sans-serif, system-ui, sans-serif",
    radius: theme.radius ?? "0.5rem",
  };
}

function PresetCard({
  item, dark, selected, onClick,
}: {
  item: TweakcnPresetItem; dark: boolean; selected: boolean; onClick: () => void;
}) {
  const c = extract(item, dark);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      title={item.title}
      className={cn(
        "flex flex-col overflow-hidden border text-left transition-transform hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        selected && "ring-2 ring-primary",
      )}
      // radius + font are the PRESET'S own (static) — not the active theme's — so
      // the card is a faithful, stable preview no matter what's selected.
      style={{ background: c.background, borderColor: selected ? c.primary : c.border, borderRadius: c.radius, fontFamily: c.fontSans }}
    >
      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-semibold" style={{ color: c.foreground }}>{item.title}</span>
          {selected ? <Check className="size-4 shrink-0" style={{ color: c.primary }} aria-hidden /> : null}
        </div>
        <div className="p-2" style={{ background: c.card, border: `1px solid ${c.border}`, borderRadius: c.radius }}>
          <p className="mb-1.5 text-[11px] leading-snug" style={{ color: c.mutedForeground }}>
            Belajar bareng, catat progres.
          </p>
          <span
            className="inline-flex px-2 py-0.5 text-[11px] font-medium"
            style={{ background: c.primary, color: c.primaryForeground, borderRadius: c.radius }}
          >
            Aksen
          </span>
        </div>
        <div className="flex gap-1">
          {c.charts.map((col, i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full" style={{ background: col }} aria-hidden />
          ))}
        </div>
      </div>
    </button>
  );
}

export function ThemePresetGallery() {
  const { registry, presetName, setPreset } = useThemePreset();
  const { theme, setTheme } = useTheme();

  const activeMode: ModeId =
    theme === "light" || theme === "dark" || theme === "system" ? theme : "system";
  const dark = activeMode === "dark";

  const groups: TweakcnPresetGroup<TweakcnPresetItem>[] = useMemo(
    () => (registry ? groupTweakcnPresets(registry.items) : []),
    [registry],
  );

  return (
    <div className="space-y-4">
      <ModeTabs activeMode={activeMode} onPick={setTheme} />

      <div className="scroll-minimal max-h-[62vh] space-y-5 overflow-y-auto rounded-xl border border-border p-3">
      <div className="space-y-1.5">
        <span className="eyebrow">Bawaan</span>
        <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-5">
          <PresetCard item={DEFAULT_ITEM} dark={dark} selected={presetName === null} onClick={() => setPreset(null)} />
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">Memuat tema…</p>
      ) : (
        groups.map((grp) => (
          <div key={grp.id} className="space-y-1.5">
            <span className="eyebrow">{grp.label}</span>
            <div className="grid grid-cols-2 gap-3 @sm:grid-cols-3 @lg:grid-cols-4 @2xl:grid-cols-5">
              {grp.items.map((p) => (
                <PresetCard
                  key={p.name}
                  item={p}
                  dark={dark}
                  selected={p.name === presetName}
                  onClick={() => setPreset(p.name)}
                />
              ))}
            </div>
          </div>
        ))
      )}
      </div>
    </div>
  );
}
