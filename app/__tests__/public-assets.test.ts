// Every `/…` asset path written in source must exist in public/.
//
// WHY THIS EXISTS. Nothing else in this repo catches a broken asset path.
// `npm run pwa:verify` is the only disk check and its scope is three files
// (app/manifest.ts, app/layout.tsx, and only the `/icons/…` strings inside
// public/sw.js) — every `<img src>` on every page is invisible to it, and so is
// public/sw.js's own PRECACHE entry for the offline art.
//
// The failure mode this closes is silent by construction: a deleted or renamed
// file leaves the source untouched, so typecheck passes, the suite stays green,
// the build succeeds, and the first symptom is a broken-image icon on a page
// nobody opened before deploying. It has already happened here twice — the
// avatar allow-list in lib/avatars.ts pins six paths no test has ever verified,
// and an asset drop landed that would have deleted /ui/404.webp, /ui/offline.webp
// and /web/hero-scene.webp out from under three live `<img>` tags.
//
// A SCAN, NOT A REGISTRY. The obvious alternative — a `lib/art.ts` exporting
// every path, checked here — only covers paths somebody remembered to register,
// which is the same class of mistake. Reading the literals straight out of the
// source covers all of them, including public/sw.js (which is plain JS shipped
// to the browser and imports nothing) and lib/avatars.ts (which is data).
import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const PUBLIC = join(ROOT, "public");

/** Where source that can reference an asset lives. */
const SOURCE_DIRS = ["app", "components", "features", "lib", "slices"];
// Specs are excluded, not just __tests__ folders: a colocated `*.test.ts`
// legitimately writes fixture paths like "/img.png" that are markdown input,
// never files this app serves.
const SOURCE_EXT = /(?<!\.test)\.(ts|tsx|mjs|js)$/;

/** Skipped wholesale: vendored upstream code we do not own the assets for. */
const SKIP_DIR = /(^|\/)(node_modules|__tests__|slices\/(appshell|notion-app))(\/|$)/;

/**
 * A quoted, absolute, same-origin path ending in an image/media extension.
 *
 * Deliberately narrow. Matching every `"/…"` would sweep in every route href
 * and turn this into a router test; anchoring on the extension keeps it to
 * things that must be a FILE on disk. Template literals and any path built by
 * concatenation are out of scope by construction — a value this cannot see is a
 * value it must not claim to have checked.
 *
 * SINGLE AND DOUBLE QUOTES ONLY, no backtick — and that is the same rule, not
 * an exception to it. Backticks were in here for one commit and the first thing
 * they flagged was a path inside a PROSE COMMENT explaining which file had just
 * been deleted, in a file whose live `<img>` was already correct. A scanner
 * that cannot tell code from commentary must not read the delimiter people
 * write commentary in.
 */
const ASSET_RE = /["'](\/[A-Za-z0-9._\-/]+\.(?:webp|png|jpg|jpeg|svg|avif|ico|webmanifest|json))["']/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (SKIP_DIR.test(full.slice(ROOT.length + 1))) continue;
    if (entry.isDirectory()) walk(full, out);
    else if (SOURCE_EXT.test(entry.name)) out.push(full);
  }
  return out;
}

/** Paths Next generates at build time — no file backs them at any location. */
const NOT_ON_DISK = new Set([
  "/manifest.webmanifest", // app/manifest.ts
  "/sw.js", // public/sw.js — real, but registered by URL, checked below
]);

/**
 * public/ is not the only place a `/foo.ext` URL can come from: Next's file
 * conventions serve `app/icon.svg` at `/icon.svg`. Resolving both keeps this
 * test about "does the URL work" rather than "is the file in one folder".
 */
const resolveAsset = (path: string): string | null =>
  [join(PUBLIC, path), join(ROOT, "app", path)].find((p) => existsSync(p)) ?? null;

const files = [
  ...SOURCE_DIRS.filter((d) => existsSync(join(ROOT, d))).flatMap((d) => walk(join(ROOT, d))),
  join(PUBLIC, "sw.js"),
];

type Ref = { path: string; from: string };
const refs: Ref[] = [];
for (const file of files) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(ASSET_RE)) {
    const path = m[1]!;
    if (NOT_ON_DISK.has(path)) continue;
    // `/_next/…` is build output, not a committed file.
    if (path.startsWith("/_next/")) continue;
    refs.push({ path, from: file.slice(ROOT.length + 1) });
  }
}

describe("public/ assets referenced from source", () => {
  it("finds asset references to check (guards against the regex silently matching nothing)", () => {
    // Without this, deleting every <img> in the app would make the suite below
    // pass vacuously — a green test that proves nothing is worse than no test.
    expect(refs.length).toBeGreaterThan(10);
  });

  it.each([...new Set(refs.map((r) => r.path))].sort())("%s exists on disk", (path) => {
    const cited = [...new Set(refs.filter((r) => r.path === path).map((r) => r.from))].join(", ");
    const on = resolveAsset(path);
    expect(on, `${path} is referenced by ${cited} but exists in neither public/ nor app/`).not.toBeNull();
    expect(statSync(on!).size, `${path} is empty`).toBeGreaterThan(0);
  });

  // The service worker precaches by literal URL and its install handler adds
  // each entry independently, so a 404 here does not fail the install loudly —
  // it just leaves that entry missing from the cache, and the symptom only
  // appears on the one screen that runs with no network.
  it("every public/sw.js PRECACHE entry resolves", () => {
    const sw = readFileSync(join(PUBLIC, "sw.js"), "utf8");
    const block = /const PRECACHE = \[([\s\S]*?)\n\];/.exec(sw);
    expect(block, "PRECACHE array not found — was public/sw.js restructured?").not.toBeNull();

    const literals = [...block![1]!.matchAll(/"(\/[^"]*)"/g)].map((m) => m[1]!);
    // OFFLINE_IMAGE is referenced by name inside the array, so resolve it.
    const named = /const OFFLINE_IMAGE = "([^"]+)"/.exec(sw);
    expect(named, "OFFLINE_IMAGE constant not found").not.toBeNull();
    const entries = [...literals, named![1]!];

    for (const entry of entries) {
      // "/offline" is a rendered route, not a file.
      if (!/\.[a-z0-9]+$/i.test(entry) || NOT_ON_DISK.has(entry)) continue;
      expect(existsSync(join(PUBLIC, entry)), `sw.js precaches ${entry}, which is not in public/`).toBe(true);
    }
  });

  // Two lists have to agree or the picker offers an avatar the validator takes
  // and the browser cannot draw. The Convex-side spec pins the STRING; nothing
  // pinned the FILE.
  it("every bundled avatar in lib/avatars.ts is a real file", async () => {
    const { BUNDLED_AVATARS } = await import("@/lib/avatars");
    expect(BUNDLED_AVATARS.length).toBeGreaterThan(0);
    for (const avatar of BUNDLED_AVATARS) {
      expect(existsSync(join(PUBLIC, avatar.path)), `${avatar.path} (${avatar.label})`).toBe(true);
    }
  });
});
