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
// Display — the small metric card and the pill.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

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
        <span className="grid size-10 shrink-0 place-items-center border border-primary/40 bg-primary/10 text-primary">
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
    "flex items-center gap-3.5 rounded-[var(--radius)] border border-border bg-card p-4 text-left shadow-sm";
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
        "inline-flex items-center border px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide",
        tone === "accent" && "bg-primary/10 text-primary",
        tone === "muted" && "border border-border text-muted-foreground",
        tone === "success" && "bg-success/10 text-success",
      )}
    >
      {children}
    </span>
  );
}
