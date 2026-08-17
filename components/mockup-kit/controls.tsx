// Mockup kit — the shared component vocabulary these screens are assembled
// from. Every primitive is:
//   • token-only  → reads --primary/--card/--border/--muted-foreground/--radius,
//                   so it follows the theme instead of hard-coding a colour.
//   • CONTAINER-responsive (@sm/@md/@lg…), never viewport (sm:/md:) — a view
//     sizes to the box it is mounted in, not to the screen.
//   • stateless / parent-controlled → no local hooks, no "use client" needed;
//     the consuming view owns state. Presentational only.
//
// Split into three files when the single module crossed the 200-line ceiling
// (`npm run audit:file-size`); `@/components/mockup-kit` still resolves here,
// so no consumer import changed.
// Controls — search field, quick actions, view toggle, filter chip.
import type { ReactNode } from "react";
import { Search, LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

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
        "flex items-center gap-2.5 rounded-[var(--radius)] border border-border bg-card px-4 py-3 text-sm transition-colors focus-within:border-primary",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={typeof placeholder === "string" ? placeholder : "Cari"}
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
          <span className="relative grid size-14 place-items-center rounded-[var(--radius)] border border-border bg-card text-muted-foreground transition-colors group-hover:border-primary group-hover:text-primary group-focus-visible:ring-2 group-focus-visible:ring-ring">
            {it.icon}
            {it.badge ? (
              <span className="absolute -right-1 -top-1 bg-primary px-1.5 py-0.5 text-[8px] font-bold uppercase leading-none text-primary-foreground">
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
    <div className="inline-flex items-center border border-border p-0.5">
      {(["list", "grid"] as const).map((v) => (
        <button
          key={v}
          type="button"
          aria-label={v === "list" ? "Tampilan daftar" : "Tampilan kisi"}
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cn(
            "grid size-7 place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
        // min-h-11 on a phone: a 36px chip is under the 44px floor and these are the
        // primary filter on the most-tapped page in the app.
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border px-3.5 py-1.5 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-11 @sm:min-h-9",
        active
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}
