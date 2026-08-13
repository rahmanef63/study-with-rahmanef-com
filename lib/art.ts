// How big an illustration renders, per slot.
//
// ─── WHY THIS FILE HOLDS SIZES AND NOTHING ELSE ──────────────────────────────
//
// The brief was "a dynamic config file, with font, size and colour as its
// knobs". Two of those three already have a file, and it is not this one:
//
//   FONT and COLOUR live in `app/globals.css`, in the Tailwind v4 `@theme`
//   block — `--font-sans` and `--font-display` at the top, the type scale under
//   THE TYPE SCALE, every colour in `:root`. There is no `tailwind.config.*`
//   anywhere in this repo and `components.json` pins `"config": ""`, so that
//   CSS block is not one source of truth among several. It is the only one.
//
//   Restating any of it here would recreate exactly what this repo deleted on
//   2026-08-09: `slices/theme-presets`, 1 154 LOC of runtime colour/radius/font
//   configuration, amputated in DECISIONS #26 along with the OS shell. A second
//   token system is not a feature this codebase is missing; it is one it has
//   already paid to remove. AGENTS.md is blunt about the surviving rule —
//   "theme tokens only (no hex)".
//
//   So: to change a font, a text size or a colour, edit `app/globals.css`. To
//   change how big a PICTURE is, edit this file.
//
// SIZE genuinely had no home. Illustration box sizes are `<img width>/<height>`
// integers, not type-scale steps, and before this file they were four magic
// numbers scattered across four files (96 in components/ui/empty.tsx, 56 in
// app/(shell)/page.tsx, 72 in papan-skor.tsx, 44 in badge-wall.tsx) with no
// stated relationship. They do have one, and it is written down below.
//
// PIXELS, NOT REM. These numbers go to the `width`/`height` attributes, which
// reserve layout space before CSS arrives and so prevent the image from
// shifting the text under it. That attribute takes device-independent pixels;
// a rem value there is invalid HTML.

/**
 * The illustration scale. Four steps, each justified by the box it sits in
 * rather than by a ratio — a picture in a 390px column is constrained by the
 * words around it, not by a modular scale.
 */
export const ART_SIZE = {
  /**
   * 96 — the media slot of an empty state (`EmptyArt`'s default).
   * The largest that keeps the title, the description AND the action inside a
   * 640px fold at 390px. Measured; see components/ui/empty.tsx.
   */
  media: 96,

  /**
   * 72 — an empty state whose panel is already dense (a leaderboard, a roster),
   * where `media` would push the first row of real content off screen.
   */
  mediaDense: 72,

  /**
   * 56 — art inside a card that also carries a heading, body and a link.
   * A 20px lucide glyph reads as decoration next to a two-line heading; 56
   * makes the picture the thing the eye lands on and the heading the answer.
   */
  card: 56,

  /**
   * 44 — a tile in a grid of many (the badge wall). Also the touch-target
   * floor this design system holds everywhere, so a tappable tile cannot be
   * smaller than its own art.
   */
  tile: 44,
} as const;

export type ArtSize = (typeof ART_SIZE)[keyof typeof ART_SIZE];
