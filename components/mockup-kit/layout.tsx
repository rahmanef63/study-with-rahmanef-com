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
// Hero + SectionHeader — the two things that open a screen.
import type { ReactNode } from "react";
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
          // Arcade marquee: hard frame + offset, never a soft gradient panel.
          ? "rounded-[var(--radius)] border border-border bg-card px-5 py-8 shadow-md @md:px-8 @md:py-10"
          : "py-1",
        centered && "text-center",
        className,
      )}
    >
      <div className={cn("space-y-2", centered && "mx-auto flex max-w-2xl flex-col items-center")}>
        {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
        <h1 className="text-base @md:text-xl [overflow-wrap:anywhere]">{title}</h1>
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
          <h2 className="text-sm @md:text-base [overflow-wrap:anywhere]">{title}</h2>
        ) : (
          <h3 className="font-display font-medium tracking-tight [overflow-wrap:anywhere]">{title}</h3>
        )}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
