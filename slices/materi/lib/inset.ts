// materi slice — the iOS "inset grouped list" geometry, in the arcade skin.
//
// These are the class strings of app/k/[slug]/_components/inset-list.tsx, the
// app's canonical primitive: one frame, N hairlines, 56px rows. They are
// RESTATED here (not imported) because a slice may not import the app layer
// (rr P1: slices stay host-agnostic) — the same reason slices/search restates
// the /k/<tenant> URL scheme. __tests__/barrel.test.ts pins the three values
// that would actually be visible if they drifted: no radius, the 3px hard
// offset shadow, and the 56px row floor.
//
// TODO(rr): waiting on integrator — promote inset-list.tsx to a shared
// primitive (components/ui or a `layout` slice) and delete this file.

/** The group frame: 2px border, hard offset shadow, hairline-divided children. */
export const INSET_GROUP =
  "divide-y divide-border border-2 border-border bg-card shadow-[3px_3px_0_0_var(--pixel-shadow)]";

/** One row. min-h-14 is the iOS 56px row — comfortably past the 44px floor. */
export const INSET_ROW =
  "flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors md:px-4";

/** iOS's grey section header. Press Start 2P at 9px, the only size where the
 *  display face is legible — never on the row titles it sits above. */
export const INSET_CAPTION =
  "pb-1.5 font-display text-[0.5625rem] uppercase tracking-[0.14em] text-muted-foreground";
