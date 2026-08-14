// courses slice — the deterministic seed behind procedural cover art.
//
// Pure, dependency-free, safe on the server: a course card is server-rendered
// on /k/[slug], so nothing here may touch the DOM.
//
// Was `cover-grid.ts`, which also carried a 24x12 pixel canvas and its
// rasterisers (setCell / fillRect / fillDisc / fillColumnDown). The art is
// vector now, so the canvas and every one of those helpers is gone; what
// survives is the part that was never about pixels — same slug, same art.

/** The art canvas, 2:1. Wide boxes see all of it; square boxes see the middle
 *  (course-cover.tsx slices rather than stretches), so a composition has to
 *  carry its identity inside x ∈ [24, 72]. */
export const COVER_W = 96;
export const COVER_H = 48;

/** One drawn shape. Everything is a <path>: one element type to render, and
 *  `fill`/`stroke` are CSS custom properties so the art re-tints with the
 *  theme and never hardcodes a hex. */
export type CoverLayer = {
  d: string;
  fill?: string;
  stroke?: string;
  opacity?: number;
  /** Stroke width in DEVICE px — course-cover.tsx sets non-scaling-stroke, so
   *  a hairline stays a hairline at 36px and at 400px alike. Without it the
   *  same art draws a 0.4px ghost in the switcher and a 5px slab on a card. */
  width?: number;
};

/** Two scene inks plus the one accent every composition may spend once. */
export type CoverInk = { a: string; b: string; accent: string };

export type Painter = (rand: () => number, ink: CoverInk) => CoverLayer[];

/** FNV-1a 32-bit. Same slug -> same art, forever, on server and client alike. */
export function hashSlug(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i += 1) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32 — 5 lines of deterministic noise, seeded from the slug hash. */
export function makeRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Two decimals is the whole precision this art needs, and it keeps the `d`
 *  strings — which ship inside the HTML of every course grid — short. */
export function n(value: number): string {
  return Number(value.toFixed(2)).toString();
}

/** A circle as path data, so every layer is one <path> and the renderer stays
 *  a single element type. Two arcs, because one arc of 360° is a no-op. */
export function circle(cx: number, cy: number, r: number): string {
  return `M${n(cx - r)} ${n(cy)}a${n(r)} ${n(r)} 0 1 0 ${n(r * 2)} 0a${n(r)} ${n(r)} 0 1 0 ${n(-r * 2)} 0`;
}

/** An axis-aligned box. */
export function box(x: number, y: number, w: number, h: number): string {
  return `M${n(x)} ${n(y)}h${n(w)}v${n(h)}h${n(-w)}z`;
}
