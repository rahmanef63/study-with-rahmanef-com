// THE PAGE TITLE, for every section under /k/<slug>.
//
// WHY THIS EXISTS NOW AND DID NOT BEFORE. Until 2026-08-11 the shell named the
// page for you: a desktop tab strip with the current tab lit, and a phone
// bottom bar with the current cell lit. Six pages under /k therefore shipped
// with no visible heading AT ALL, each with a comment explaining that the tab
// bar already said "Anggota" and that repeating it cost 70–190px. Those
// comments were right, and they died with the bars.
//
// What replaced them is a rail — which is off-screen below md, behind a
// hamburger. So on a 390px phone the top bar reads the COMMUNITY name, the
// layout's only <h1> is `sr-only`, and a member who taps into Peringkat lands
// on a list of numbers with nothing on screen saying what they are looking at.
// That is the "page that starts with no context at all" this component fixes.
// At md and up it is the ordinary dashboard pairing: the rail says where you
// are in the app, the content pane says what this page is.
//
// IT IS AN <h2>, NOT AN <h1>. The layout owns the <h1> (the community name,
// sr-only, server-rendered on every route). A screen reader therefore hears
// "Belajar AI bareng Rahman" → "Peringkat", which is the true outline; a second
// <h1> would flatten it and put two page titles in the document.
//
// BUDGET: title only is ~30px on a phone. `description` is deliberately opt-in
// and used on exactly the two pages that already had one (Cari, Kelola) — the
// three-line blocks the old header carried are what made a heading feel
// expensive, not the heading.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageHeading({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  /** One line of orientation. Omit unless the title genuinely is not enough. */
  description?: ReactNode;
  /** Share button and friends. Wraps under the title on a narrow container. */
  actions?: ReactNode;
  /** Pass `mb-0` when the parent already owns the rhythm with `space-y-*`;
   *  otherwise the default 20px and the parent's gap stack into 40px. */
  className?: string;
}) {
  return (
    <div
      className={cn(
        // border-b-2 with no colour class on purpose: globals.css carries an
        // UNLAYERED `* { border-color: var(--color-border) }` that beats any
        // Tailwind border-* utility, so the token is already what renders and
        // naming it would be a lie about where the colour comes from.
        "mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-2 border-b-2 pb-3",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        {/* font-display is DISPLAY-ONLY and ~2x the advance width of the body
            face; every title under /k is one short word, so text-sm (13px of
            Press Start 2P ≈ a 20px sans line) clears 390px with room to spare
            and steps up once the container is wide. [overflow-wrap:anywhere]
            is the guard for the day one of them is not. */}
        <h2 className="font-display text-sm uppercase [overflow-wrap:anywhere] @sm:text-base">
          {title}
        </h2>
        {description ? (
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </div>
  );
}
