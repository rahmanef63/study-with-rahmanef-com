// Install-surface VERIFIER — `npm run pwa:verify`. Generates nothing. Read this.
//
// The FILE and the COMMAND were renamed with it. While it was still called
// generateIcons.mjs behind `pwa:icons`, the name promised exactly the clobber
// this rewrite exists to prevent — someone reaching for it to "regenerate the
// icons" is the failure mode, and a name that invites the mistake is not fixed
// by a comment explaining the mistake.
//
// THIS FILE USED TO BE A GENERATOR and that is now the danger, not the feature.
// It hand-encoded a 2-colour placeholder icon (the procedural book-and-spark
// mark) straight into public/icons/{icon-192,icon-512,icon-maskable-512,
// apple-touch-icon-180}.png. Those four URLs now hold real commissioned art
// from the asset pack (see scripts/optimize-assets.mjs), so running the old
// generator would have silently overwritten the upload with the placeholder —
// same filenames, no diff to notice until someone looked at their home screen.
//
// Deleting it outright would leave `npm run pwa:verify` pointing at a missing
// file. Instead the command is INVERTED: the thing that used to clobber the
// icons is now the thing that proves they are intact. The generator's most
// valuable half was always the self-verify pass, and that half generalises —
// it just needed to stop assuming it drew the pixels itself.
//
// FOLLOW-UP FOR WHOEVER OWNS package.json: rename the script to `pwa:verify`.
// The filename and the npm alias both still say "generate" and both now lie.
// Not renamed here because package.json is outside this change's file set.
//
// WHAT IT CHECKS — the install surface can drift in four ways, and every one of
// them ships silently (a broken PWA looks fine in dev and in `next build`):
//   1. A referenced file is GONE. This is not hypothetical: four icon PNGs were
//      deleted from public/icons while app/manifest.ts and app/layout.tsx still
//      named them. That is the bug this script exists to catch first.
//   2. Declared `sizes` disagree with the actual IHDR. Chrome drops a manifest
//      icon whose pixels do not match its `sizes`, and drops a screenshot the
//      same way, without a console warning you will see in production.
//   3. An icon carries an ALPHA CHANNEL. A transparent PWA icon renders as a
//      black blob on several Android launchers.
//   4. The maskable is a byte-for-byte copy of the "any" icon. That shipped
//      once. A maskable needs a safe zone; a full-bleed copy gets its artwork
//      cropped into by the launcher mask.
// It does NOT re-measure the maskable's safe-zone geometry — that needs a full
// palette-PNG decode and belongs with the tool that builds the icon
// (scripts/optimize-assets.mjs, which measured the wordmark at r=159.2 of 256).
// The sha check below is the regression guard for the defect that actually hit.
//
// Zero dependencies on purpose: IHDR lives at a fixed offset in every PNG, so
// reading it costs four lines and cannot rot the way a sharp/PIL import can.
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

// Two public URLs are NOT files under public/ — they are Next file conventions
// compiled at build time. Map them so "does it resolve" stays a real question.
const CONVENTIONS = { "/icon.svg": "app/icon.svg", "/manifest.webmanifest": "app/manifest.ts" };
const localPath = (url) => CONVENTIONS[url] ?? join("public", url);

/** Every { src, sizes } pair in app/manifest.ts — icons, shortcut icons, screenshots. */
function manifestRefs() {
  const src = read("app/manifest.ts");
  const refs = [...src.matchAll(/src:\s*"(\/[^"]+)"\s*,\s*sizes:\s*"([^"]+)"/g)].map((m) => ({
    url: m[1],
    sizes: m[2],
    from: "manifest.ts",
  }));
  // A src with no sizes within reach means the regex above skipped an entry —
  // fail loudly rather than quietly verifying a subset.
  const srcCount = [...src.matchAll(/src:\s*"\//g)].length;
  if (refs.length !== srcCount) throw new Error(`manifest.ts: ${srcCount} src, matched ${refs.length}`);
  return refs;
}

/** Every <link href="/..."> rendered into <head> by app/layout.tsx. */
function layoutRefs() {
  return [...read("app/layout.tsx").matchAll(/<link[^>]*\shref="(\/[^"]+)"[^>]*>/g)].map((m) => ({
    url: m[1],
    sizes: /\ssizes="([^"]+)"/.exec(m[0])?.[1] ?? null,
    from: "layout.tsx",
  }));
}

/** Icon URLs the service worker precaches. A 404 here is a cache.add that no-ops. */
function swRefs() {
  return [...read("public/sw.js").matchAll(/"(\/icons\/[^"]+)"/g)].map((m) => ({
    url: m[1],
    sizes: null,
    from: "sw.js",
  }));
}

const COLOUR = { 0: "gray", 2: "rgb", 3: "palette", 4: "gray+alpha", 6: "rgba" };

/** IHDR + chunk walk. Returns dimensions and whether any transparency is encoded. */
function inspectPng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  const colour = buf[25];
  let off = 8;
  let tRNS = false;
  while (off + 12 <= buf.length) {
    const len = buf.readUInt32BE(off);
    if (buf.toString("ascii", off + 4, off + 8) === "tRNS") tRNS = true;
    off += len + 12;
  }
  return {
    w: buf.readUInt32BE(16),
    h: buf.readUInt32BE(20),
    depth: buf[24],
    colour: COLOUR[colour] ?? `type${colour}`,
    // Both routes to a transparent pixel: a true alpha channel, or a palette
    // index flagged transparent by tRNS. Either one is the black-blob bug.
    alpha: colour === 4 || colour === 6 || tRNS,
  };
}

const rows = [];
const fail = [];
const seen = new Map();

// Dedupe by URL but keep every citation, so the table reads as "who depends on
// this" — that is the context you want when a file turns up missing.
for (const ref of [...manifestRefs(), ...layoutRefs(), ...swRefs()]) {
  const hit = seen.get(ref.url);
  if (hit) {
    if (!hit.from.includes(ref.from)) hit.from += " + " + ref.from;
    if (ref.sizes && !hit.sizes) hit.sizes = ref.sizes;
    continue;
  }
  seen.set(ref.url, { ...ref });
}

for (const { url, sizes, from } of seen.values()) {
  const rel = localPath(url);
  const row = { url, from, sizes: sizes ?? "—", actual: "", bytes: 0, ok: "" };
  rows.push(row);

  if (!existsSync(join(ROOT, rel))) {
    row.ok = "MISSING";
    fail.push(`${url} — referenced by ${from}, no file at ${rel}`);
    continue;
  }
  const buf = readFileSync(join(ROOT, rel));
  row.bytes = buf.length;

  if (!url.endsWith(".png")) {
    // app/icon.svg and app/manifest.ts: existence is the whole contract.
    row.actual = "n/a";
    row.ok = "ok";
    continue;
  }
  const png = inspectPng(buf);
  row.actual = `${png.w}x${png.h} ${png.depth}-bit ${png.colour}`;
  const problems = [];
  if (sizes && sizes !== "any" && sizes !== `${png.w}x${png.h}`) {
    problems.push(`declared ${sizes}, IHDR ${png.w}x${png.h}`);
  }
  if (png.alpha) problems.push("has transparency (black-blob risk on Android)");
  row.ok = problems.length ? "FAIL" : "ok";
  for (const p of problems) fail.push(`${url} — ${p}`);
}

// The defect that shipped: maskable byte-identical to the full-bleed "any" art.
const sha = (rel) => createHash("sha256").update(readFileSync(join(ROOT, rel))).digest("hex");
const ANY = "public/icons/icon-512.png";
const MASK = "public/icons/icon-maskable-512.png";
if (existsSync(join(ROOT, ANY)) && existsSync(join(ROOT, MASK))) {
  const [a, m] = [sha(ANY), sha(MASK)];
  const distinct = a !== m;
  rows.push({
    url: "maskable ≠ any",
    from: "safe-zone guard",
    sizes: a.slice(0, 12),
    actual: m.slice(0, 12),
    bytes: 0,
    ok: distinct ? "ok" : "FAIL",
  });
  if (!distinct) fail.push("icon-maskable-512.png is a byte copy of icon-512.png — no safe zone");
}

console.table(rows);
if (fail.length) {
  console.error(`\n${fail.length} problem(s):`);
  for (const f of fail) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`\n${rows.length - 1} install-surface references verified.`);
