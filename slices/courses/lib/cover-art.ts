// courses slice — procedural cabinet art for a course with no coverImageUrl.
//
// WHY: production courses have no cover, so every card fell back to a grey
// checkerboard — the store screenshot advertised an unfinished product. This
// is a PURE FUNCTION of the slug: no files, no uploads, no host, no DB write,
// no dependency. Course #7, added by an instructor next month, gets real art
// with zero setup.
//
// Colours are CSS custom properties (never hex), so the art re-tints with the
// theme. Output is a handful of merged <path> strings — never one element per
// pixel — because six of these render behind a grid on a mid-range Android.
import { COVER_H, COVER_W, hashSlug, makeGrid, makeRandom } from "./cover-grid";
import { COVER_PATTERNS } from "./cover-patterns";

export type CoverLayer = { fill: string; opacity: number; d: string };
export type CoverArt = {
  /** Composition name — useful for debugging and tests, not rendered. */
  pattern: string;
  width: number;
  height: number;
  /** Full-bleed sky behind every layer. */
  base: string;
  layers: CoverLayer[];
};

/** The sprite ramp. --chart-3 is deliberately absent: it holds the same value
 *  as --primary, which every composition reserves as its coin-gold HIGHLIGHT,
 *  so allowing it as a scene ink produced gold-on-gold covers. Four inks x the
 *  three partners each can take = 12 palettes across 6 compositions. */
const INKS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

/** Slot -> ink + opacity. Index 0 is the base and is drawn as one rect. */
function palette(inkA: string, inkB: string): ReadonlyArray<[string, number]> {
  return [
    ["var(--background)", 1],
    [inkA, 0.18],
    [inkA, 0.45],
    [inkA, 1],
    [inkB, 0.45],
    [inkB, 1],
    ["var(--primary)", 1],
    ["var(--foreground)", 0.9],
  ];
}

/** Greedy rectangle merge: whole-pixel cells collapse into as few boxes as
 *  possible, so a solid sky costs one `M` command instead of 288. */
function toPath(grid: Uint8Array, slot: number, used: Uint8Array): string {
  let d = "";
  for (let y = 0; y < COVER_H; y += 1) {
    for (let x = 0; x < COVER_W; x += 1) {
      const i = y * COVER_W + x;
      if (grid[i] !== slot || used[i] === 1) continue;
      let w = 1;
      while (x + w < COVER_W && grid[i + w] === slot && used[i + w] === 0) w += 1;
      let h = 1;
      grow: while (y + h < COVER_H) {
        for (let k = 0; k < w; k += 1) {
          const j = (y + h) * COVER_W + x + k;
          if (grid[j] !== slot || used[j] === 1) break grow;
        }
        h += 1;
      }
      for (let dy = 0; dy < h; dy += 1) {
        for (let dx = 0; dx < w; dx += 1) used[(y + dy) * COVER_W + x + dx] = 1;
      }
      d += `M${x} ${y}h${w}v${h}h-${w}z`;
    }
  }
  return d;
}

const cache = new Map<string, CoverArt>();

/** Deterministic: same slug -> same art, forever, on server and client. */
export function coverArt(slug: string): CoverArt {
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;

  const h = hashSlug(slug);
  const a = h % INKS.length;
  const b = (a + 1 + ((h >>> 8) % (INKS.length - 1))) % INKS.length;
  const slots = palette(INKS[a], INKS[b]);
  const pattern = COVER_PATTERNS[(h >>> 11) % COVER_PATTERNS.length];

  const grid = makeGrid();
  pattern.paint(grid, makeRandom(h));

  const used = new Uint8Array(COVER_W * COVER_H);
  const layers: CoverLayer[] = [];
  for (let slot = 1; slot < slots.length; slot += 1) {
    const d = toPath(grid, slot, used);
    if (d !== "") layers.push({ fill: slots[slot][0], opacity: slots[slot][1], d });
  }

  const art: CoverArt = {
    pattern: pattern.name,
    width: COVER_W,
    height: COVER_H,
    base: slots[0][0],
    layers,
  };
  // Bounded so a long-lived server process can't grow this without limit.
  if (cache.size > 96) cache.clear();
  cache.set(slug, art);
  return art;
}
