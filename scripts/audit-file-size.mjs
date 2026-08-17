#!/usr/bin/env node
// `npm run audit:file-size` — the 200-LOC ceiling from docs/rr-conventions.md,
// made runnable. AGENTS.md §5.4 named this command as a definition-of-done
// item; it did not exist until now.
//
// WHAT THE RULE IS ACTUALLY FOR. It exists to stop LOGIC files from growing
// into the kind of module nobody dares open. It was never meant to cap a file
// whose length is its content — a curriculum, a changelog, a vendored
// primitive. Applied literally it fires on 18 files here, 15 of which are
// exactly that, and a check that cries wolf 15 times gets muted within a week.
//
// So there is an allowlist, and every entry states WHY it is exempt. The bar
// for adding one: the file's size must come from DATA or from code we did not
// write. "It is hard to split" is not on that list.
//
// `*.test.ts` is exempt by the convention itself — a thorough spec file is not
// the debt this rule exists to prevent.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
const LIMIT = 200;
const ROOTS = ["app", "components", "lib", "slices", "convex", "hooks"];

/** Path prefixes exempt from the ceiling, each with the reason it qualifies.
 *  DATA or NOT-OURS only. */
const ALLOW = [
  ["convex/_seed/", "isi kurikulum — data, bukan logika; panjangnya = materinya"],
  ["lib/changelog-data.ts", "data changelog; tumbuh satu entri per rilis, selamanya"],
  ["components/ui/", "primitif shadcn yang di-vendor — kode pihak lain"],
  ["slices/responsive-dialog/", "slice di-vendor dari katalog rr — kode pihak lain"],
];

const SKIP_DIR = new Set(["node_modules", "_generated", "__tests__", ".next"]);
const isTest = (p) => /\.test\.[cm]?[jt]sx?$/.test(p) || p.includes("__tests__");
const isSource = (p) => /\.[cm]?[jt]sx?$/.test(p) && !/\.d\.ts$/.test(p);

function walk(dir, out = []) {
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out; // root tidak ada di repo ini — bukan kegagalan
  }
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (!SKIP_DIR.has(e.name)) walk(full, out);
    } else if (isSource(full) && !isTest(full)) {
      out.push(full);
    }
  }
  return out;
}

const files = ROOTS.flatMap((r) => walk(join(ROOT, r)));
const over = [];
const exempt = [];

/** Hitung baris seperti `wc -l`: jumlah newline. `split("\n").length` kelebihan
 *  satu untuk file yang diakhiri newline (hampir semuanya), dan di batas itu
 *  bukan detail — ia menjatuhkan file yang panjangnya PERSIS 200. */
function countLines(text) {
  const parts = text.split("\n");
  if (parts[parts.length - 1] === "") parts.pop();
  return parts.length;
}

for (const full of files) {
  const rel = relative(ROOT, full);
  const lines = countLines(readFileSync(full, "utf8"));
  if (lines <= LIMIT) continue;
  const allowed = ALLOW.find(([prefix]) => rel.startsWith(prefix));
  (allowed ? exempt : over).push({ rel, lines, why: allowed?.[1] });
}

over.sort((a, b) => b.lines - a.lines);
exempt.sort((a, b) => b.lines - a.lines);

console.log(`audit:file-size — batas ${LIMIT} baris untuk file non-test\n`);
console.log(`  ${files.length} file sumber diperiksa`);
console.log(`  ${exempt.length} lewat batas tapi DIKECUALIKAN (data / kode pihak lain)`);
for (const f of exempt) console.log(`    · ${f.rel} (${f.lines}) — ${f.why}`);

if (over.length) {
  console.error(`\nGAGAL — ${over.length} file logika melewati ${LIMIT} baris:`);
  for (const f of over) console.error(`  • ${f.rel} — ${f.lines} baris`);
  console.error("\n  Pecah file-nya. Menambahkannya ke allowlist hanya sah kalau");
  console.error("  panjangnya berasal dari DATA atau dari kode yang bukan kita tulis.");
  process.exit(1);
}

console.log(`\n  0 pelanggaran.`);
