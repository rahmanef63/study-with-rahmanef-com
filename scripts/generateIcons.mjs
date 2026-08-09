// PWA icon ladder generator — `npm run pwa:icons`. Output is COMMITTED so the
// Docker build never runs this.
//
// No sharp / canvas / resvg. The brand mark (components/brand/logo.tsx) is a
// grid of whole pixels in two flat colours, so there is nothing to rasterise:
// we build the grid, scale it by an EXACT integer factor (nearest neighbour on
// an integer scale is lossless), and hand-roll the PNG with node:zlib. A
// 2-colour palette PNG (colour type 3) is the smallest possible encoding and
// needs no alpha channel — every icon here is fully opaque on purpose, because
// a transparent PWA icon renders as a black blob on some Android launchers.
//
// Deliberately different from CareerPack: it ships 9 "any" sizes. Android and
// iOS both downscale from the largest available icon, so 192 + 512 + maskable
// + apple-180 is the whole useful ladder; the other six were dead bytes.
import { deflateSync, inflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

// Arcade cabinet base tokens, resolved from the oklch() values in globals.css.
// Hex is unavoidable here: a PNG cannot read a CSS variable.
const BG = "#090f1c"; // --background
const GOLD = "#f9c423"; // --primary (coin gold)

/** Brand mark on its 16x16 grid — mirrors LOGO runs in components/brand/logo.tsx: [x, y, width]. */
const LOGO = [
  [7, 0, 2], [6, 1, 4], [7, 2, 2], // spark
  // KEEP IN SYNC with PAGE_ROWS in components/brand/logo.tsx — the launcher
  // icon and the in-app header mark have to be the same drawing. The x=6 and
  // x=9 gaps are the page gutters; without them the pages and spine fuse into
  // one gold slab that stops reading as a book (see the comment there).
  [3, 5, 3], [10, 5, 3], // top taper
  ...[6, 7, 8, 9, 10, 11].flatMap((y) => [[2, y, 4], [10, y, 4]]), // pages
  [3, 12, 3], [10, 12, 3], // bottom taper
  ...[5, 6, 7, 8, 9, 10, 11, 12].map((y) => [7, y, 2]), // spine
];

/** Paint the mark into `px` (index 1 = gold) at integer `scale`, offset by (ox, oy). */
function drawMark(px, size, scale, ox, oy) {
  for (const [x, y, w] of LOGO) {
    for (let dy = 0; dy < scale; dy++) {
      const py = y * scale + dy + oy;
      for (let dx = 0; dx < w * scale; dx++) {
        const pxx = x * scale + dx + ox;
        if (pxx >= 0 && pxx < size && py >= 0 && py < size) px[py * size + pxx] = 1;
      }
    }
  }
}

// Both launcher grids are 64 units, which divides 192 (3x) and 512 (8x)
// exactly, and both centre the mark at 3x with the same offset — the "any"
// icon is literally the maskable plus a frame.
const MARK_SCALE = 3;
const MARK_OFF = [8, 12]; // centres the 12x13 mark bbox in 64 units

/**
 * "any" art: CRT-black field, 4-unit coin-gold frame inset by 2, mark centred.
 * app/icon.svg packs the mark edge-to-edge inside its frame, which is fine at
 * 32px but reads as a solid gold slab on a 512 launcher tile; the extra 6 units
 * of gutter here is the only deliberate departure from that file.
 */
function gridAny() {
  const N = 64;
  const px = new Uint8Array(N * N);
  for (let y = 2; y <= 61; y++) {
    for (let x = 2; x <= 61; x++) {
      if (x <= 5 || x >= 58 || y <= 5 || y >= 58) px[y * N + x] = 1;
    }
  }
  drawMark(px, N, MARK_SCALE, ...MARK_OFF);
  return { N, px };
}

/**
 * Maskable art: NO frame (Android crops to a circle and would eat the corners)
 * and a full-bleed field. Mark at 3x sits entirely inside the 80% safe zone —
 * the furthest painted pixel is r=23.4 of the 25.6 budget.
 */
function gridMaskable() {
  const N = 64;
  const px = new Uint8Array(N * N);
  drawMark(px, N, MARK_SCALE, ...MARK_OFF);
  return { N, px };
}

/** Apple art on a 36-unit grid: iOS applies its own squircle mask, so full-bleed + a roomier mark. */
function gridApple() {
  const N = 36;
  const px = new Uint8Array(N * N);
  drawMark(px, N, 2, 2, 5);
  return { N, px };
}

// ── PNG encoding (palette, 8-bit, no interlace) ────────────────────────────
const CRC = Int32Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});
const crc32 = (buf) => {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
};
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const tail = Buffer.alloc(4);
  tail.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, tail]);
}

/** Scale a {N, px} grid by an exact integer factor and encode it as a PNG buffer. */
function encode(grid, scale, palette) {
  const size = grid.N * scale;
  const raw = Buffer.alloc(size * (size + 1)); // one filter byte (0 = None) per row
  for (let y = 0; y < size; y++) {
    const row = y * (size + 1);
    const src = Math.floor(y / scale) * grid.N;
    for (let x = 0; x < size; x++) raw[row + 1 + x] = grid.px[src + Math.floor(x / scale)];
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 3, 0, 0, 0], 8); // depth 8, colour type 3 (palette)
  const plte = Buffer.concat(palette.map((h) => Buffer.from(h.slice(1), "hex")));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("PLTE", plte),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** Decode our own output and assert it round-trips — a corrupt icon fails installability silently. */
function verify(buf, grid, scale) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("bad PNG signature");
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const size = grid.N * scale;
  if (w !== size || h !== size) throw new Error(`IHDR ${w}x${h}, expected ${size}x${size}`);
  if (buf[24] !== 8 || buf[25] !== 3) throw new Error("IHDR not 8-bit palette");
  let off = 8;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("ascii", off + 4, off + 8);
    if (type === "IDAT") idat.push(buf.subarray(off + 8, off + 8 + len));
    off += len + 12;
  }
  const raw = inflateSync(Buffer.concat(idat));
  if (raw.length !== size * (size + 1)) throw new Error("IDAT wrong length");
  let gold = 0;
  for (let y = 0; y < size; y++) {
    if (raw[y * (size + 1)] !== 0) throw new Error("unexpected row filter");
    for (let x = 0; x < size; x++) {
      const got = raw[y * (size + 1) + 1 + x];
      const want = grid.px[Math.floor(y / scale) * grid.N + Math.floor(x / scale)];
      if (got !== want) throw new Error(`pixel drift at ${x},${y}`);
      if (got === 1) gold++;
    }
  }
  if (gold < size * size * 0.05) throw new Error("art is nearly empty");
  return { w, h, gold };
}

const ANY = gridAny();
const MASK = gridMaskable();
const APPLE = gridApple();
const JOBS = [
  ["public/icons/icon-192.png", ANY, 3, [BG, GOLD]],
  ["public/icons/icon-512.png", ANY, 8, [BG, GOLD]],
  ["public/icons/icon-maskable-512.png", MASK, 8, [BG, GOLD]],
  ["public/icons/apple-touch-icon-180.png", APPLE, 5, [BG, GOLD]],
];

const rows = [];
for (const [rel, grid, scale, palette] of JOBS) {
  const buf = encode(grid, scale, palette);
  const { w, h, gold } = verify(buf, grid, scale);
  const out = join(ROOT, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  rows.push({
    file: rel,
    px: `${w}x${h}`,
    grid: `${grid.N}@${scale}x`,
    bytes: buf.length,
    ink: `${((gold / (w * h)) * 100).toFixed(1)}%`,
    ok: "verified",
  });
}
console.table(rows);
