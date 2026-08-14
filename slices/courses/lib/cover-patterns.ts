// courses slice — the six cover COMPOSITIONS, drawn as vector geometry on the
// 96x48 canvas from cover-seed.ts.
//
// These replaced six pixel-art scenes (a sunset ridge, a starfield, a circuit
// board, a skyline, waves, a dungeon) that were right for the arcade skin and
// wrong for what replaced it: with the chrome on Sora, hairlines and soft
// corners, nine chunky 16-bit scenes in a grid were the loudest thing left on
// the page. Same contract as before — the hash picks the composition, so six
// courses are six different MARKS, not six colourways of one image.
//
// EVERY COMPOSITION IS CENTRE-SAFE. course-cover.tsx slices instead of
// stretching, so a 36px square box shows only x ∈ [24, 72]. Nothing that
// carries the identity may sit outside that band; the wide box gets the same
// mark with more air around it, which is the point.
import { COVER_H, COVER_W, box, circle, n, type Painter } from "./cover-seed";

const CX = COVER_W / 2;
const CY = COVER_H / 2;

/** Concentric rings with one lit node on the outer orbit. */
const orbit: Painter = (rand, ink) => {
  const rings = 3 + Math.floor(rand() * 2);
  const step = 5.5 + rand() * 1.5;
  const layers = Array.from({ length: rings }, (_, i) => ({
    d: circle(CX, CY, 6.5 + i * step),
    stroke: ink.a,
    opacity: 0.5 - i * 0.09,
    width: 1,
  }));
  // The node rides the SECOND ring, not the outermost. The outer ring is
  // allowed to run off the wide canvas and be cropped — a ring bleeding past
  // the edge still reads as a ring — but the accent is the identity, and at
  // rings=4 the outer orbit reaches x=75, outside the centre-safe band.
  const orbitR = 6.5 + step;
  const angle = rand() * Math.PI * 2;
  return [
    ...layers,
    { d: circle(CX, CY, 3.2), fill: ink.b, opacity: 0.9 },
    {
      d: circle(CX + Math.cos(angle) * orbitR, CY + Math.sin(angle) * orbitR, 2),
      fill: ink.accent,
      opacity: 0.95,
    },
  ];
};

/** A hairline lattice with two cells filled in. */
const lattice: Painter = (rand, ink) => {
  const step = rand() < 0.5 ? 8 : 6;
  let d = "";
  for (let x = step; x < COVER_W; x += step) d += `M${n(x)} 0V${COVER_H}`;
  for (let y = step; y < COVER_H; y += step) d += `M0 ${n(y)}H${COVER_W}`;
  const cell = (i: number) => {
    const cols = Math.floor(24 / step);
    const rows = Math.floor(COVER_H / step);
    const c = Math.floor(rand() * cols) * step + (CX - 24 + i * step);
    const r = Math.floor(rand() * rows) * step;
    return box(c, r, step, step);
  };
  return [
    { d, stroke: ink.a, opacity: 0.2, width: 1 },
    { d: cell(0), fill: ink.b, opacity: 0.55 },
    { d: cell(1), fill: ink.accent, opacity: 0.85 },
  ];
};

/** Nested quarter arcs, like a signal sweeping out from one corner. */
const sweep: Painter = (rand, ink) => {
  const arcs = 3 + Math.floor(rand() * 2);
  const flip = rand() < 0.5 ? 1 : -1;
  const gap = 4.5 + rand() * 2;
  const layers = Array.from({ length: arcs }, (_, i) => {
    const r = 7 + i * gap;
    const x0 = CX - r * flip;
    return {
      d: `M${n(x0)} ${n(CY)}A${n(r)} ${n(r)} 0 0 ${flip > 0 ? 1 : 0} ${n(CX)} ${n(CY - r)}`,
      stroke: i === arcs - 1 ? ink.b : ink.a,
      opacity: 0.6 - i * 0.1,
      width: 1,
    };
  });
  return [...layers, { d: box(CX - 1.5, CY - 1.5, 3, 3), fill: ink.accent, opacity: 0.95 }];
};

/** An equaliser: upright bars on a shared baseline, one of them lit. */
const bars: Painter = (rand, ink) => {
  const count = 5 + Math.floor(rand() * 3);
  const w = 4;
  const gap = 2;
  const span = count * w + (count - 1) * gap;
  const x0 = CX - span / 2;
  const base = CY + 15;
  const lit = Math.floor(rand() * count);
  return Array.from({ length: count }, (_, i) => {
    const h = 7 + rand() * 22;
    return {
      d: box(x0 + i * (w + gap), base - h, w, h),
      fill: i === lit ? ink.accent : i % 2 === 0 ? ink.a : ink.b,
      opacity: i === lit ? 0.95 : 0.35 + (i % 2) * 0.25,
    };
  });
};

/** A short path through connected nodes. */
const nodes: Painter = (rand, ink) => {
  const count = 4 + Math.floor(rand() * 3);
  const pts = Array.from({ length: count }, (_, i) => ({
    x: CX - 20 + (i * 40) / (count - 1),
    y: CY - 13 + rand() * 26,
  }));
  const edges = pts.map((p, i) => `${i === 0 ? "M" : "L"}${n(p.x)} ${n(p.y)}`).join("");
  const lit = Math.floor(rand() * count);
  return [
    { d: edges, stroke: ink.a, opacity: 0.55, width: 1 },
    {
      d: pts.filter((_, i) => i !== lit).map((p) => circle(p.x, p.y, 2.2)).join(""),
      fill: ink.b,
      opacity: 0.9,
    },
    { d: circle(pts[lit]!.x, pts[lit]!.y, 3), fill: ink.accent, opacity: 0.95 },
  ];
};

/** Nested chevrons — direction, without an arrowhead. */
const chevron: Painter = (rand, ink) => {
  const count = 3 + Math.floor(rand() * 2);
  const gap = 5 + rand() * 2;
  const up = rand() < 0.5;
  const half = 11;
  return Array.from({ length: count }, (_, i) => {
    const x = CX - (count - 1) * gap * 0.5 + i * gap;
    const tip = up ? CY - half : CY + half;
    return {
      d: `M${n(x - half * 0.75)} ${n(up ? CY + half * 0.4 : CY - half * 0.4)}L${n(x)} ${n(tip)}L${n(x + half * 0.75)} ${n(up ? CY + half * 0.4 : CY - half * 0.4)}`,
      stroke: i === count - 1 ? ink.accent : i % 2 === 0 ? ink.a : ink.b,
      opacity: i === count - 1 ? 0.9 : 0.5,
      width: 1,
    };
  });
};

export const COVER_PATTERNS: ReadonlyArray<{ name: string; paint: Painter }> = [
  { name: "orbit", paint: orbit },
  { name: "lattice", paint: lattice },
  { name: "sweep", paint: sweep },
  { name: "bars", paint: bars },
  { name: "nodes", paint: nodes },
  { name: "chevron", paint: chevron },
];
