// courses slice — procedural art for a course with no coverImageUrl.
//
// WHY: production courses have no cover, so every card fell back to a grey
// checkerboard — the store screenshot advertised an unfinished product. This
// is a PURE FUNCTION of the slug: no files, no uploads, no host, no DB write,
// no dependency. Course #7, added by an instructor next month, gets real art
// with zero setup.
//
// Colours are CSS custom properties (never hex), so the art re-tints with the
// theme. Output is a handful of <path> strings — never one element per pixel —
// because six of these render behind a grid on a mid-range Android.
//
// WAS PIXEL ART, on a 24x12 whole-pixel grid with a greedy rectangle merge to
// keep the path count down. The skin it belonged to was retired in 3e64bda and
// the covers were the loudest thing left; the grid, its rasterisers and the
// merge are all gone with it. The contract did not change: same slug, same art,
// tokens only, few paths.
import { COVER_H, COVER_W, hashSlug, makeRandom, type CoverLayer } from "./cover-seed";
import { COVER_PATTERNS } from "./cover-patterns";

export type { CoverLayer } from "./cover-seed";

export type CoverArt = {
  /** Composition name — useful for debugging and tests, not rendered. */
  pattern: string;
  width: number;
  height: number;
  /** Full-bleed field behind every layer. */
  base: string;
  /** The wash over the base: one ink fading to nothing across `angle` degrees. */
  wash: { ink: string; angle: number };
  layers: CoverLayer[];
};

/** The scene ramp. --chart-3 is deliberately absent: it holds the same value
 *  as --primary, which every composition reserves as its single ACCENT, so
 *  allowing it as a scene ink produced accent-on-accent covers. */
const INKS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-4)",
  "var(--chart-5)",
] as const;

const WASH_ANGLES = [90, 135, 180, 225] as const;

const cache = new Map<string, CoverArt>();

/** Deterministic: same slug -> same art, forever, on server and client. */
export function coverArt(slug: string): CoverArt {
  const hit = cache.get(slug);
  if (hit !== undefined) return hit;

  const h = hashSlug(slug);
  const a = h % INKS.length;
  // +1 so the partner is never the same ink: a two-ink composition drawn in one
  // colour is a one-ink composition with extra steps.
  const b = (a + 1 + ((h >>> 8) % (INKS.length - 1))) % INKS.length;
  const pattern = COVER_PATTERNS[(h >>> 11) % COVER_PATTERNS.length]!;

  const art: CoverArt = {
    pattern: pattern.name,
    width: COVER_W,
    height: COVER_H,
    base: "var(--background)",
    wash: { ink: INKS[a]!, angle: WASH_ANGLES[(h >>> 17) % WASH_ANGLES.length]! },
    layers: pattern.paint(makeRandom(h), {
      a: INKS[a]!,
      b: INKS[b]!,
      accent: "var(--primary)",
    }),
  };

  // Bounded so a long-lived server process can't grow this without limit.
  if (cache.size > 96) cache.clear();
  cache.set(slug, art);
  return art;
}
