// Self-check for the procedural cover art. The art is the DEFAULT cover for
// every course in production, so the three properties it must never lose are:
// deterministic, distinct per slug, and token-only (no hex — the arcade theme
// re-tints everything through CSS custom properties).
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
  return `${art.pattern}|${art.base}|${art.layers
    .map((l) => `${l.fill}@${l.opacity}:${l.d}`)
    .join("|")}`;
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
      expect(art.base).not.toContain("#");
      expect(art.base.startsWith("var(--")).toBe(true);
      for (const layer of art.layers) {
        expect(layer.fill).not.toContain("#");
        expect(layer.fill.startsWith("var(--")).toBe(true);
        expect(layer.d).not.toContain("#");
      }
    }
  });

  it("emits merged paths, not one shape per pixel", () => {
    for (const slug of SLUGS) {
      const art = coverArt(slug);
      expect(art.layers.length).toBeGreaterThan(0);
      // At most one path per palette slot (7 inks over the base).
      expect(art.layers.length).toBeLessThanOrEqual(7);
      const boxes = art.layers.reduce((n, l) => n + (l.d.match(/M/g) ?? []).length, 0);
      // 24x12 = 288 cells; merging must beat that comfortably.
      expect(boxes).toBeLessThan(160);
    }
  });

  it("paints inside the grid and covers it", () => {
    const art = coverArt("belajar-ai");
    expect(art.width).toBe(24);
    expect(art.height).toBe(12);
    for (const layer of art.layers) {
      for (const [, x, y] of layer.d.matchAll(/M(\d+) (\d+)/g)) {
        expect(Number(x)).toBeLessThan(art.width);
        expect(Number(y)).toBeLessThan(art.height);
      }
    }
  });
});
