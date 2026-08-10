// courses slice — the six cabinet-art COMPOSITIONS. Each painter fills a
// 24x12 grid with palette slots (see cover-art.ts PALETTE):
//   0 sky/base · 1 far haze · 2 mid ink · 3 near ink · 4 accent dim
//   5 accent · 6 coin highlight · 7 spark (foreground)
// The hash picks the composition, so six courses are six different SCENES,
// not six colourways of one image.
import {
  COVER_H,
  COVER_W,
  clamp,
  fillColumnDown,
  fillDisc,
  fillRect,
  setCell,
  type Grid,
} from "./cover-grid";

type Painter = (g: Grid, rand: () => number) => void;

/** Height profile of a mountain range: overlapping triangles, so the ridge is
 *  jagged and readable instead of the plateau a random walk produces. */
function ridgeLine(rand: () => number, peaks: number, min: number, max: number): number[] {
  const tops = Array.from({ length: peaks }, () => ({
    x: Math.floor(rand() * COVER_W),
    h: min + Math.floor(rand() * (max - min + 1)),
  }));
  return Array.from({ length: COVER_W }, (_, x) =>
    tops.reduce((best, p) => Math.max(best, p.h - Math.abs(x - p.x)), 0),
  );
}

/** Sunset ridge — slitted retro sun, two ranges, perspective grid floor. */
const ridge: Painter = (g, rand) => {
  // Every dial here is randomised, not just the hue: with only six
  // compositions a six-course grid WILL draw the same one twice, and two
  // identical ridges in different colours is the failure this art exists to
  // avoid. Horizon, star sky, sun size, range count and grid pitch all move.
  const horizon = 6 + Math.floor(rand() * 3);
  fillRect(g, 0, horizon - 2, COVER_W, 2, 1);
  if (rand() < 0.5) {
    for (let i = 0; i < 8; i += 1) {
      setCell(g, Math.floor(rand() * COVER_W), Math.floor(rand() * (horizon - 2)), 7);
    }
  }
  const sunR = 1 + Math.floor(rand() * 3);
  const sunX = 3 + Math.floor(rand() * 18);
  const sunY = clamp(horizon - 3 - sunR, 1, COVER_H - 1);
  fillDisc(g, sunX, sunY, sunR, 6);
  for (let k = 1; k <= sunR; k += 2) fillRect(g, sunX - sunR, sunY + k, sunR * 2 + 1, 1, 0);
  const back = ridgeLine(rand, 2 + Math.floor(rand() * 3), 2, horizon - 1);
  const front = rand() < 0.75 ? ridgeLine(rand, 1 + Math.floor(rand() * 3), 1, horizon - 2) : null;
  for (let x = 0; x < COVER_W; x += 1) {
    if (back[x] > 0) fillRect(g, x, horizon - back[x], 1, back[x], 2);
    if (front !== null && front[x] > 0) fillRect(g, x, horizon - front[x], 1, front[x], 3);
  }
  // Synthwave floor: a DARK plane scored by a glowing grid. (A bright floor
  // with darker gaps reads as a fence, not a horizon — checked on screen.)
  fillRect(g, 0, horizon, COVER_W, COVER_H - horizon, 1);
  const pitch = 3 + Math.floor(rand() * 3);
  for (let x = Math.floor(rand() * pitch); x < COVER_W; x += pitch) {
    fillColumnDown(g, x, horizon, 4);
  }
  fillRect(g, 0, horizon + 3, COVER_W, 1, 4);
  fillRect(g, 0, horizon, COVER_W, 1, 5);
};

/** Deep space — nebula, stars, a crescent-lit planet and one comet. */
const starfield: Painter = (g, rand) => {
  const nx = Math.floor(rand() * COVER_W);
  fillDisc(g, nx, 3 + Math.floor(rand() * 6), 4, 1);
  fillDisc(g, nx + 2, 4 + Math.floor(rand() * 4), 2, 2);
  for (let i = 0; i < 26; i += 1) {
    setCell(g, Math.floor(rand() * COVER_W), Math.floor(rand() * COVER_H), rand() < 0.25 ? 6 : 7);
  }
  const cx = 5 + Math.floor(rand() * 15);
  const cy = 5 + Math.floor(rand() * 3);
  fillDisc(g, cx, cy, 3, 5);
  fillDisc(g, cx - 1, cy - 1, 3, 4);
  const cometX = 2 + Math.floor(rand() * 5);
  for (let i = 0; i < 3; i += 1) setCell(g, cometX + i, 2 - i + 2, 6);
  setCell(g, cometX + 3, 1, 7);
};

/** Circuit board — traces, vias and one chip. Reads as "the machine". */
const circuit: Painter = (g, rand) => {
  for (let y = 0; y < COVER_H; y += 1) {
    for (let x = 0; x < COVER_W; x += 1) if ((x * 5 + y * 3) % 11 === 0) setCell(g, x, y, 2);
  }
  for (let i = 0; i < 3; i += 1) {
    const row = 1 + Math.floor(rand() * (COVER_H - 2));
    fillRect(g, 0, row, COVER_W, 1, 5);
    const branch = 2 + Math.floor(rand() * (COVER_W - 4));
    const dir = rand() < 0.5 ? -1 : 1;
    for (let k = 1; k <= 3; k += 1) setCell(g, branch, row + k * dir, 5);
    setCell(g, branch, row + 4 * dir, 6);
    setCell(g, 0, row, 6);
    setCell(g, COVER_W - 1, row, 6);
  }
  const chipX = 4 + Math.floor(rand() * 12);
  const chipY = 3 + Math.floor(rand() * 4);
  fillRect(g, chipX, chipY, 5, 4, 3);
  fillRect(g, chipX + 1, chipY + 1, 3, 2, 2);
  for (let k = 0; k < 5; k += 2) {
    setCell(g, chipX + k, chipY - 1, 6);
    setCell(g, chipX + k, chipY + 4, 6);
  }
};

/** Night skyline — DARK towers, lit windows. The "kota" scene. The towers are
 *  silhouettes on purpose: bright towers swallow the windows, and the windows
 *  are the only part of this scene that says "a city at night". */
const skyline: Painter = (g, rand) => {
  fillDisc(g, rand() < 0.5 ? 3 : COVER_W - 4, 2, 2, 6);
  for (let i = 0; i < 10; i += 1) {
    setCell(g, Math.floor(rand() * COVER_W), Math.floor(rand() * 4), 7);
  }
  let x = 0;
  while (x < COVER_W) {
    const bw = 2 + Math.floor(rand() * 2);
    const bh = 3 + Math.floor(rand() * 5);
    fillRect(g, x, COVER_H - bh, bw, bh, rand() < 0.5 ? 1 : 2);
    if (rand() < 0.6) fillRect(g, x, COVER_H - bh, bw, 1, 4);
    for (let wy = COVER_H - bh + 1; wy < COVER_H - 1; wy += 2) {
      for (let wx = x + 1; wx < x + bw; wx += 2) {
        if (rand() < 0.65) setCell(g, wx, wy, rand() < 0.3 ? 7 : 6);
      }
    }
    x += bw;
  }
  fillRect(g, 0, COVER_H - 1, COVER_W, 1, 5);
};

/** Ocean bands — stacked sine crests, back to front. The only curved scene. */
const waves: Painter = (g, rand) => {
  fillRect(g, 0, 0, COVER_W, 2, 1);
  fillDisc(g, 3 + Math.floor(rand() * 18), 2, 1, 6);
  const phase = rand() * 6;
  const slots = [1, 2, 4, 5];
  for (let layer = 0; layer < slots.length; layer += 1) {
    for (let x = 0; x < COVER_W; x += 1) {
      const wobble = 1.2 * Math.sin((x + phase + layer * 5) / (2.6 + layer * 0.4));
      const y = clamp(3 + Math.round(layer * 2.2 + wobble), 0, COVER_H - 1);
      fillColumnDown(g, x, y, slots[layer]);
      // Foam only on the near bands — a crest on every band is noise.
      if (layer === 3 || (layer === 2 && x % 2 === 0)) setCell(g, x, y, 6);
    }
  }
};

/** Dungeon map — blocky maze, a coin and a gem. The "quest" scene. */
const dungeon: Painter = (g, rand) => {
  for (let y = 1; y < COVER_H - 1; y += 2) {
    for (let x = 1; x < COVER_W - 1; x += 2) setCell(g, x, y, 1);
  }
  fillRect(g, 0, 0, COVER_W, 1, 2);
  fillRect(g, 0, COVER_H - 1, COVER_W, 1, 2);
  fillRect(g, 0, 0, 1, COVER_H, 2);
  fillRect(g, COVER_W - 1, 0, 1, COVER_H, 2);
  for (let by = 2; by < COVER_H - 2; by += 3) {
    for (let bx = 2; bx < COVER_W - 2; bx += 3) {
      if (rand() < 0.45) fillRect(g, bx, by, 2, 2, rand() < 0.5 ? 3 : 4);
      else if (rand() < 0.4) setCell(g, bx, by, 2);
    }
  }
  for (let x = 2; x < COVER_W - 2; x += 2) setCell(g, x, COVER_H - 2, 5);
  fillDisc(g, 3 + Math.floor(rand() * 8), 3 + Math.floor(rand() * 5), 1, 6);
  setCell(g, COVER_W - 4 - Math.floor(rand() * 6), 2 + Math.floor(rand() * 7), 7);
};

/** Ordered — the hash indexes this list, so the mapping is frozen. */
export const COVER_PATTERNS: ReadonlyArray<{ name: string; paint: Painter }> = [
  { name: "ridge", paint: ridge },
  { name: "starfield", paint: starfield },
  { name: "circuit", paint: circuit },
  { name: "skyline", paint: skyline },
  { name: "waves", paint: waves },
  { name: "dungeon", paint: dungeon },
];
