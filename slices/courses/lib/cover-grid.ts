// courses slice — the pixel canvas behind procedural cover art (cover-art.ts).
// Pure, dependency-free, safe on the server: a course card is server-rendered
// on /k/[slug], so nothing here may touch the DOM.
//
// A cover is a 24x12 grid of WHOLE PIXELS. Each cell holds a palette INDEX
// (0..7), never a colour — cover-art.ts resolves indexes to CSS custom
// properties so the art re-tints with the theme and never hardcodes a hex.

/** Cabinet-art grid. 2:1 is the widest a card cover gets before it reads thin. */
export const COVER_W = 24;
export const COVER_H = 12;

/** One cell per pixel; the value is a palette slot (see PALETTE in cover-art). */
export type Grid = Uint8Array;

export function makeGrid(): Grid {
  return new Uint8Array(COVER_W * COVER_H);
}

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

export function setCell(g: Grid, x: number, y: number, slot: number): void {
  if (x < 0 || y < 0 || x >= COVER_W || y >= COVER_H) return;
  g[y * COVER_W + x] = slot;
}

export function fillRect(
  g: Grid,
  x: number,
  y: number,
  w: number,
  h: number,
  slot: number,
): void {
  for (let dy = 0; dy < h; dy += 1) {
    for (let dx = 0; dx < w; dx += 1) setCell(g, x + dx, y + dy, slot);
  }
}

/** Bresenham-free disc: a filled circle rasterised to whole cells. */
export function fillDisc(g: Grid, cx: number, cy: number, r: number, slot: number): void {
  const rr = (r + 0.35) * (r + 0.35);
  for (let y = cy - r; y <= cy + r; y += 1) {
    for (let x = cx - r; x <= cx + r; x += 1) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= rr) setCell(g, x, y, slot);
    }
  }
}

/** Fill a column downwards from `y` to the bottom edge. */
export function fillColumnDown(g: Grid, x: number, y: number, slot: number): void {
  for (let yy = Math.max(0, y); yy < COVER_H; yy += 1) setCell(g, x, yy, slot);
}

export function clamp(n: number, lo: number, hi: number): number {
  return n < lo ? lo : n > hi ? hi : n;
}
