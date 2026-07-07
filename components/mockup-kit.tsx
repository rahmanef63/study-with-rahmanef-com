// Mockup kit — the "Design Platform Wireframe" component vocabulary, rebuilt in
// THIS app's design system (Editorial Warmth tokens + theme presets), not the
// wireframe's grayscale/Kalam skin. Every primitive is:
//   • token-only  → reads --primary/--card/--border/--muted-foreground/--radius-win,
//                    so it tracks the active theme preset (the mockup's accent-swap knob).
//   • CONTAINER-responsive (@sm/@md/@lg…), never viewport (sm:/md:) — app views mount
//     in a [container-type:inline-size] body, so they must size to the WINDOW, not the
//     screen. This is what keeps a view identical across macOS / Windows / mobile / dashboard.
//   • stateless / parent-controlled → no local hooks, no "use client" needed; the
//     consuming view owns state. Presentational only.
// Home: shared by the Dashboard chrome AND every app view (os-shell + slice views),
// so it lives in @/components (importable from both without a slice dependency edge).
import type { ReactNode } from "react";
import { Search, ChevronDown, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page hero — eyebrow + display title + optional lead + slot (search / actions).
 *  `gradient` renders it as a self-contained accent-soft panel (the mockup's
 *  HeroHeader). No negative-margin bleed → safe to drop into any view / padding.
 *  Left-aligned by default (safe upgrade for any view); center for home screens. */
export function Hero({
  eyebrow,
  title,
  description,
  align = "left",
  gradient = true,
  children,
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  align?: "left" | "center";
  gradient?: boolean;
  children?: ReactNode;
  className?: string;
}) {
  const centered = align === "center";
  return (
    <header
      className={cn(
        "relative",
        gradient
          ? "rounded-[var(--radius-win)] bg-gradient-to-b from-primary/[0.08] to-transparent to-90% px-5 py-8 @md:px-8 @md:py-10 dark:from-primary/[0.14]"
          : "py-1",
        centered && "text-center",
        className,
      )}
    >
      <div className={cn("space-y-2", centered && "mx-auto flex max-w-2xl flex-col items-center")}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="text-3xl @md:text-4xl">{title}</h1>
        {description ? (
          <p className="max-w-xl text-pretty text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children ? (
        <div className={cn("mt-5", centered && "mx-auto max-w-2xl")}>{children}</div>
      ) : null}
    </header>
  );
}

/** Section heading — display h2 (or h3) + optional trailing actions (ViewToggle,
 *  FilterChips…). Bottom hairline mirrors the mockup's ContentSection headers. */
export function SectionHeader({
  eyebrow,
  title,
  actions,
  as: As = "h2",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  actions?: ReactNode;
  as?: "h2" | "h3";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-3",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        {As === "h2" ? (
          <h2 className="text-xl @md:text-2xl">{title}</h2>
        ) : (
          <h3 className="font-serif text-lg font-medium tracking-tight">{title}</h3>
        )}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}

/** Command search — the mockup's bordered rounded search field. Controlled: the
 *  view owns `value`. `onSubmit` fires on Enter (optional). */
export function CommandSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Cari…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-win)] border border-border bg-card px-4 py-3 text-sm transition-colors focus-within:border-primary/50",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </form>
  );
}

export type QuickAction = {
  id: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  badge?: string;
};

/** Quick-action row — the mockup's horizontal category strip: icon tiles + labels.
 *  Scrolls sideways when it overflows (uses the shared .scroll-minimal styling). */
export function QuickActionRow({ items, className }: { items: QuickAction[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("scroll-minimal -mx-1 flex gap-3 overflow-x-auto px-1 pb-1", className)}>
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={it.onClick}
          className="group flex w-[74px] shrink-0 flex-col items-center gap-1.5 focus-visible:outline-none"
        >
          <span className="relative grid size-14 place-items-center rounded-[var(--radius-win)] border border-border bg-card text-muted-foreground transition-colors group-hover:border-primary/40 group-hover:text-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
            {it.icon}
            {it.badge ? (
              <span className="absolute -right-1 -top-1 rounded-full bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-primary-foreground">
                {it.badge}
              </span>
            ) : null}
          </span>
          <span className="line-clamp-2 text-center text-[11px] leading-tight text-muted-foreground group-hover:text-foreground">
            {it.label}
          </span>
        </button>
      ))}
    </div>
  );
}

/** List/grid view toggle — joined icon buttons, active one filled with accent. */
export function ViewToggle({
  value,
  onChange,
}: {
  value: "list" | "grid";
  onChange: (v: "list" | "grid") => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border p-0.5">
      {(["list", "grid"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-label={v === "list" ? "Tampilan daftar" : "Tampilan kisi"}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "grid size-7 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v === "list" ? <List className="size-3.5" /> : <LayoutGrid className="size-3.5" />}
        </button>
      ))}
    </div>
  );
}

/** Filter chip — pill button with a chevron (mockup's Dropdown affordance). The
 *  view wires the actual menu; `active` tints it when a filter is applied. */
export function FilterChip({
  label,
  onClick,
  active,
}: {
  label: ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
      <ChevronDown className="size-3.5 opacity-60" aria-hidden />
    </button>
  );
}

/** Stat tile — the mockup's small metric card (icon + label + value + hint).
 *  Renders as a button when `onClick` is given, otherwise a static div. */
export function StatTile({
  icon,
  label,
  value,
  hint,
  onClick,
}: {
  icon?: ReactNode;
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {icon ? (
        <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-win)] bg-primary/10 text-primary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium">
          {label} · {value}
        </span>
        {hint ? <span className="block truncate text-xs text-muted-foreground">{hint}</span> : null}
      </span>
    </>
  );
  const base =
    "flex items-center gap-3.5 rounded-[var(--radius-win)] border border-border bg-card p-4 text-left";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        base,
        "transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
    >
      {inner}
    </button>
  ) : (
    <div className={base}>{inner}</div>
  );
}

/** Small pill — mono "Baru" accents, owner/meta chips. */
export function Badge({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "accent" | "muted" | "success";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        tone === "accent" && "bg-primary/10 text-primary",
        tone === "muted" && "border border-border text-muted-foreground",
        tone === "success" && "bg-success/10 text-success",
      )}
    >
      {children}
    </span>
  );
}
