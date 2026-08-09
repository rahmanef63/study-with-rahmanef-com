// PWA manifest screenshots — `npm run pwa:screenshots`. Output is COMMITTED;
// the Docker build never runs this and Playwright stays a devDependency.
//
// These are what turn the Android install prompt from a one-line "Add to home
// screen?" into a rich card, so they are worth 60 lines of script. Point it at
// a LOCAL PRODUCTION BUILD (dev serves un-minified CSS and an overlay):
//
//   NEXT_PUBLIC_CONVEX_URL=https://rare-toucan-552.convex.cloud npx next build
//   npx next start &
//   npm run pwa:screenshots
//
// Sizes are fixed by the manifest entries (app/manifest.ts) and asserted below —
// Chrome silently drops a screenshot whose real pixels disagree with `sizes`.
import { mkdirSync, readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BASE = process.env.PWA_SHOT_URL ?? "http://localhost:3000";

const SHOTS = [
  // Pixel-7 class viewport — the device this product is actually used on.
  // The narrow shot IS the Android rich-install card. "/" redirects to the
  // Kelas grid, where two of three visible cards are the empty-cover
  // checkerboard fallback — the install prompt would advertise a product that
  // looks unfinished. Diskusi is text-dense and renders honestly at 412px.
  { file: "narrow.png", path: "/k/belajar-ai/diskusi", width: 412, height: 915 },
  { file: "wide.png", path: "/", width: 1280, height: 720 },
];

const browser = await chromium.launch();
const rows = [];
try {
  for (const shot of SHOTS) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: 1, // PNG pixels must equal CSS pixels or `sizes` lies
      colorScheme: "dark",
      reducedMotion: "reduce", // freeze .blink / .marquee-text mid-cycle
    });
    const res = await page.goto(BASE + shot.path, { waitUntil: "networkidle", timeout: 60_000 });
    if (!res?.ok()) throw new Error(`${BASE}${shot.path} -> ${res?.status()}`);
    await page.evaluate(() => document.fonts.ready);
    const out = join(ROOT, "public/screenshots", shot.file);
    mkdirSync(dirname(out), { recursive: true });
    await page.screenshot({ path: out, fullPage: false });
    await page.close();

    // Assert the committed PNG really is the size the manifest claims.
    const buf = readFileSync(out);
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    if (w !== shot.width || h !== shot.height) {
      throw new Error(`${shot.file}: got ${w}x${h}, manifest says ${shot.width}x${shot.height}`);
    }
    rows.push({ file: `public/screenshots/${shot.file}`, px: `${w}x${h}`, kb: Math.round(buf.length / 1024) });
  }
} finally {
  await browser.close();
}
console.table(rows);
