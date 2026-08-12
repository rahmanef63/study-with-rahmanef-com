// Asset-pack normaliser — ONE-OFF, RUN BY HAND:
//
//   node scripts/optimize-assets.mjs [srcDir] [--keep]
//
// NOT wired into `next build`, and it must never be. It reads a drop of
// numbered design exports (`09_pwa_192.png`) and emits the canonical public/
// tree the app links to. Those files change about once a quarter; a build-time
// step would re-encode 9 MB of PNG on every Dokploy deploy forever to produce
// bytes that are already committed. Run it when a pack lands, LOOK at the
// output, commit the result.
//
// Why the split (the icons/ URLs are a published contract — app/layout.tsx,
// app/manifest.ts and public/sw.js hardcode them):
//   icons/   stay PNG — Safari will not take a WebP apple-touch-icon.
//   social/  stay PNG — WhatsApp/Facebook/X unfurlers do not reliably render
//            WebP, and a broken link preview is worse than 300 KB.
//   brand/   stay PNG — for use OUTSIDE the app (README, Discord, press);
//            components/brand/logo.tsx is the in-app wordmark.
//   ui/ web/ learning/ profiles/  -> WebP, rendered by our own <img>.
//
// No new npm dependency: sharp is already in the tree as Next's image
// optimiser.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
// sharp is NOT in package.json — it resolves transitively through Next's own
// install. Declaring it would add a dependency for a tool that runs by hand
// once per asset drop, which the brief forbids and which would slow every
// Docker build; the trade is that this script throws on a tree where Next has
// not hoisted it. Run it from the repo root, after `npm ci`.
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = join(ROOT, "public");

/** --background from app/globals.css: oklch(0.17 0.028 264) -> #090f1c.
 *  Same value as manifest background_color/theme_color and verifyInstallSurface.mjs. */
const BG = "#090f1c";

/** Fraction of the icon the maskable art is scaled to. 0.80 is the web
 *  maskable safe zone (content inside a circle of 80% diameter) AND clears
 *  Android's stricter 66.7% guaranteed-visible circle — see the report in
 *  the commit that added this file for the measured wordmark radii. */
const SAFE = 0.8;

/** Below this PSNR a palette round-trip is not "lossless enough" and the
 *  source bytes are kept instead. Every file that passes was also checked by
 *  eye at 3x on its worst-error block. */
const PSNR_FLOOR = 40;

/** export ordinal -> [path under public/, mode] */
const PLAN = {
  "01": ["brand/wordmark-horizontal.png", "png"],
  "02": ["brand/wordmark-stacked.png", "png"],
  "03": ["brand/wordmark-compact.png", "png"],
  "04": ["brand/wordmark-light.png", "png"],
  "05": ["icons/icon-16.png", "png"],
  "06": ["icons/icon-32.png", "png"],
  "07": ["icons/icon-48.png", "png"],
  "08": ["icons/apple-touch-icon-180.png", "png"],
  "09": ["icons/icon-192.png", "png"],
  10: ["icons/icon-512.png", "png"],
  11: ["icons/icon-maskable-512.png", "maskable"],
  12: ["social/og-default.png", "png"],
  13: ["social/github-preview.png", "png"],
  14: ["social/discord-banner.png", "png"],
  15: ["social/community-banner.png", "png"],
  16: ["web/hero.webp", "webp"],
  17: ["ui/404.webp", "webp"],
  18: ["ui/offline.webp", "webp"],
  19: ["ui/empty-courses.webp", "webp"],
  20: ["ui/empty-results.webp", "webp"],
  21: ["ui/empty-notifications.webp", "webp"],
  22: ["learning/course-cover-template.webp", "webp"],
  23: ["social/share-card.png", "png"],
  24: ["learning/certificate-bg.webp", "webp"],
  25: ["profiles/avatar-pria-1.webp", "webp"],
  26: ["profiles/avatar-pria-2.webp", "webp"],
  27: ["profiles/avatar-wanita-1.webp", "webp"],
  28: ["profiles/avatar-berhijab-1.webp", "webp"],
  29: ["profiles/avatar-badge.webp", "webp"],
  30: ["profiles/avatar-default.png", "png"],
};

const sha = (b) => createHash("sha256").update(b).digest("hex");

/** Peak signal-to-noise vs the source, over raw decoded pixels.
 *  removeAlpha() is not cosmetic: a composited buffer decodes to 4 channels
 *  and a palette PNG to 3, and comparing those element-wise silently yields
 *  NaN — which reads as "quality gate failed" and quietly keeps the 60 KB
 *  larger encode. Normalise both sides, then assert. */
async function psnr(a, b) {
  const [x, y] = await Promise.all([a, b].map((v) => sharp(v).removeAlpha().raw().toBuffer()));
  if (x.length !== y.length) throw new Error(`psnr geometry mismatch: ${x.length} vs ${y.length}`);
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += (x[i] - y[i]) ** 2;
  const mse = sum / x.length;
  return mse === 0 ? Infinity : 20 * Math.log10(255 / Math.sqrt(mse));
}

/** Smallest of {source, lossless re-encode, 256-colour palette}. The palette
 *  only competes if it clears PSNR_FLOOR. Keeping the source is a real
 *  outcome: these exports are already well deflated, so sharp's lossless
 *  re-encode comes out ~15% LARGER on the big social cards. */
async function bestPng(src) {
  const cands = [
    ["source", src, Infinity],
    ["lossless", await sharp(src).png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer(), Infinity],
  ];
  const pal = await sharp(src).png({ palette: true, colours: 256, dither: 0, effort: 10 }).toBuffer();
  const q = await psnr(src, pal);
  if (q >= PSNR_FLOOR) cands.push(["palette256", pal, q]);
  cands.sort((a, b) => a[1].length - b[1].length);
  const [how, buf, p] = cands[0];
  const grade = p === Infinity ? "exact" : `${p.toFixed(1)}dB`;
  return { buf, note: how === "palette256" ? `palette256 ${grade}` : how };
}

/** Lossy q82 vs lossless WebP, smaller wins. Flat art (few hundred colours)
 *  compresses smaller LOSSLESS than at q82, so this is free quality there. */
async function bestWebp(src) {
  const lossy = await sharp(src).webp({ quality: 82, effort: 6 }).toBuffer();
  const ll = await sharp(src).webp({ lossless: true, effort: 6 }).toBuffer();
  return ll.length < lossy.length ? { buf: ll, note: "webp lossless" } : { buf: lossy, note: "webp q82" };
}

/** Rebuild a maskable that has a real safe zone.
 *  Layer 1 is the untouched art at full bleed, so the field runs edge to edge
 *  and NO mask shape can reveal a seam; layer 2 is the same art at SAFE scale,
 *  which fully covers layer 1's wordmark and leaves the mark inside the safe
 *  circle. BG sits underneath as the opacity backstop — a maskable with alpha
 *  renders as a black blob on some Android launchers. */
async function buildMaskable(src) {
  const { width, height } = await sharp(src).metadata();
  const inner = Math.round(width * SAFE);
  const off = Math.round((width - inner) / 2);
  const art = await sharp(src).resize(inner, inner, { kernel: "lanczos3" }).toBuffer();
  // flatten() is load-bearing, not belt-and-braces: composite() promotes the
  // canvas to RGBA, and shipping a maskable with an alpha channel is the
  // black-blob bug. This is where BG stops being decorative.
  const flat = await sharp({ create: { width, height, channels: 3, background: BG } })
    .composite([{ input: src }, { input: art, top: off, left: off }])
    .flatten({ background: BG })
    .png()
    .toBuffer();
  const out = await bestPng(flat);
  return { buf: out.buf, note: `safe-zone ${SAFE} + ${out.note}` };
}

/** Every numbered export under `dir`, keyed by its ordinal. */
function collect(dir, found = new Map()) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) collect(p, found);
    else {
      const m = /^(\d{2})_/.exec(e.name);
      if (m) found.set(String(Number(m[1])), p);
    }
  }
  return found;
}

const args = process.argv.slice(2);
const keep = args.includes("--keep");
const srcDir = resolve(ROOT, args.find((a) => !a.startsWith("--")) ?? "public");
const sources = collect(srcDir);

const missing = Object.keys(PLAN).filter((k) => !sources.has(String(Number(k))));
if (missing.length) throw new Error(`no export found for ordinal(s): ${missing.join(", ")}`);

// Snapshot before the loop: the "any" 512 export is consumed (and deleted)
// before the maskable's turn comes round.
const ANY_512 = sha(readFileSync(sources.get("10")));

let before = 0;
let after = 0;
const rows = [];

for (const [ord, [rel, mode]] of Object.entries(PLAN)) {
  const from = sources.get(String(Number(ord)));
  const src = readFileSync(from);
  const srcBytes = src.length;
  // A maskable that is a byte-identical copy of the 512 has no safe zone, so
  // rebuild it; a genuinely different one is trusted and only optimised.
  const isCopy = mode === "maskable" && sha(src) === ANY_512;
  const { buf, note } =
    mode === "webp" ? await bestWebp(src) : isCopy ? await buildMaskable(src) : await bestPng(src);

  const meta = await sharp(buf).metadata();
  const sm = await sharp(src).metadata();
  if (meta.width !== sm.width || meta.height !== sm.height) throw new Error(`${rel}: ${meta.width}x${meta.height} != source`);

  const out = join(PUBLIC, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, buf);
  if (!keep) rmSync(from);

  before += srcBytes;
  after += buf.length;
  rows.push([rel, `${meta.width}x${meta.height}`, srcBytes, buf.length, `${(100 - (buf.length / srcBytes) * 100).toFixed(0)}%`, note]);
}

for (const r of rows) console.log(r.join("\t"));
console.log(`\nTOTAL\t${before}\t${after}\tsaved ${(before - after).toLocaleString()} B (${(100 - (after / before) * 100).toFixed(1)}%)`);
