// Self-check for the procedural cover art. The art is the DEFAULT cover for
// every course in production, so the properties it must never lose are:
// deterministic, distinct per slug, token-only (no hex — the theme re-tints
// everything through CSS custom properties), cheap to render, and readable in
// the smallest box it is asked to fill.
import { describe, expect, it } from "vitest";
import { COVER_PATTERNS } from "../lib/cover-patterns";
import { coverArt } from "../lib/cover-art";

const SLUGS = [
  "belajar-ai",
  "prompt-dasar",
  "otomasi-wa",
  "excel-untuk-ai",
  "riset-pakai-ai",
  "bikin-konten",
  "jualan-online",
  "n8n-pemula",
  "a",
  "",
];

function serialize(slug: string): string {
  const art = coverArt(slug);
  return `${art.pattern}|${art.base}|${art.wash.ink}@${art.wash.angle}|${art.layers
    .map((l) => `${l.fill ?? "-"}/${l.stroke ?? "-"}@${l.opacity ?? 1}:${l.d}`)
    .join("|")}`;
}

/** Every absolute move in a path — the only coordinates a pattern chooses
 *  outright. Arc and line offsets after them stay within a few units. */
function moves(d: string): Array<{ x: number; y: number }> {
  return [...d.matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)].map((m) => ({
    x: Number(m[1]),
    y: Number(m[2]),
  }));
}

describe("coverArt", () => {
  it("is deterministic — the same slug always yields the same art", () => {
    for (const slug of SLUGS) {
      // Not just cache echo: hash + PRNG + painter must be reproducible.
      expect(serialize(slug)).toBe(serialize(slug));
    }
    expect(serialize("belajar-ai")).toBe(serialize("belajar-ai"));
  });

  it("gives different slugs different art", () => {
    const seen = new Set(SLUGS.map(serialize));
    expect(seen.size).toBe(SLUGS.length);
  });

  it("varies the COMPOSITION, not just the hue", () => {
    const many = Array.from({ length: 400 }, (_, i) => coverArt(`kelas-${i}`).pattern);
    const patterns = new Set(many);
    // Every composition in the table must be reachable from real slugs.
    expect(patterns.size).toBe(COVER_PATTERNS.length);
    expect(COVER_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it("never hardcodes a hex colour — tokens only", () => {
    for (const slug of SLUGS) {
      const art = coverArt(slug);
      for (const value of [art.base, art.wash.ink]) {
        expect(value).not.toContain("#");
        expect(value.startsWith("var(--")).toBe(true);
      }
      for (const layer of art.layers) {
        for (const value of [layer.fill, layer.stroke]) {
          if (value === undefined) continue;
          expect(value).not.toContain("#");
          expect(value.startsWith("var(--")).toBe(true);
        }
        expect(layer.d).not.toContain("#");
      }
    }
  });

  it("stays cheap — a handful of paths, not one per shape", () => {
    for (const slug of SLUGS) {
      const art = coverArt(slug);
      expect(art.layers.length).toBeGreaterThan(0);
      // Six of these render behind a course grid on a mid-range Android, and
      // every path ships inside the page HTML.
      expect(art.layers.length).toBeLessThanOrEqual(10);
      const chars = art.layers.reduce((total, l) => total + l.d.length, 0);
      expect(chars).toBeLessThan(1200);
    }
  });

  it("draws inside the canvas", () => {
    for (const slug of SLUGS) {
      const art = coverArt(slug);
      expect(art.width).toBe(96);
      expect(art.height).toBe(48);
      for (const layer of art.layers) {
        for (const { x, y } of moves(layer.d)) {
          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThanOrEqual(art.width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThanOrEqual(art.height);
        }
      }
    }
  });

  it("keeps the accent inside the centre-safe band", () => {
    // THE RULE A SQUARE BOX DEPENDS ON. course-cover.tsx slices instead of
    // stretching, so a 36px switcher thumbnail and a 44px home-screen tile see
    // ONLY x ∈ [24, 72] of this 96-wide canvas. Background texture may run off
    // the sides — a cropped ring still reads as a ring — but the one accent
    // shape is what makes a cover recognisable, and a cover whose accent is
    // cropped away is a flat rectangle at every size that matters most.
    for (let i = 0; i < 400; i += 1) {
      const art = coverArt(`kelas-${i}`);
      const accents = art.layers.filter(
        (l) => l.fill === "var(--primary)" || l.stroke === "var(--primary)",
      );
      expect(accents.length).toBeGreaterThan(0);
      for (const layer of accents) {
        for (const { x } of moves(layer.d)) {
          expect(x).toBeGreaterThanOrEqual(24);
          expect(x).toBeLessThanOrEqual(72);
        }
      }
    }
  });
});
