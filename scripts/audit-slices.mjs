#!/usr/bin/env node
// `npm run audit:slices` — the metadata-pair gate from AGENTS.md §5.4 and
// SLICES.md ("Definition of done"): every slice ships `slice.json` +
// `slice.manifest.json`, and their `version` fields agree.
//
// WHY THIS FILE EXISTS. Both documents made this a definition-of-done item and
// named this exact command, but the script was never written — `npm run
// audit:slices` answered "Missing script" for the whole life of the repo. A
// gate nobody can run is not a gate; it is a sentence in a document. The rule
// was worth keeping, so the script is what changed.
//
// WHAT A DRIFTED PAIR ACTUALLY COSTS. The pair is how a slice states its
// contract to consumers: `slice.json` carries the human/`rr` metadata,
// `slice.manifest.json` the machine one. When the versions disagree, a consumer
// pinning either file is pinning a fiction, and `rr` cannot tell an upgrade
// from a no-op. That is why the check is equality, not "both present".
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SLICES = join(ROOT, "slices");

/** Read JSON, or return a typed failure instead of throwing — a malformed file
 *  is a finding to report, not a stack trace to decode. */
function readJson(path) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const problems = [];
const rows = [];

for (const name of readdirSync(SLICES, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort()) {
  const dir = join(SLICES, name);
  const jsonPath = join(dir, "slice.json");
  const manifestPath = join(dir, "slice.manifest.json");

  if (!existsSync(jsonPath)) {
    problems.push(`${name}: slice.json hilang`);
    rows.push([name, "—", "—", "TIDAK ADA"]);
    continue;
  }
  if (!existsSync(manifestPath)) {
    problems.push(`${name}: slice.manifest.json hilang (pasangan metadata tidak lengkap)`);
    rows.push([name, "?", "—", "TIDAK ADA"]);
    continue;
  }

  const a = readJson(jsonPath);
  const b = readJson(manifestPath);
  if (!a.ok || !b.ok) {
    problems.push(`${name}: JSON tidak bisa di-parse — ${(a.ok ? b : a).error}`);
    rows.push([name, "ERR", "ERR", "RUSAK"]);
    continue;
  }

  const va = a.value.version ?? null;
  const vb = b.value.version ?? null;
  if (!va || !vb) {
    problems.push(`${name}: field "version" kosong di ${!va ? "slice.json" : "slice.manifest.json"}`);
    rows.push([name, va ?? "—", vb ?? "—", "TANPA VERSI"]);
    continue;
  }
  if (va !== vb) {
    problems.push(`${name}: versi tidak sinkron — slice.json ${va} vs manifest ${vb}`);
    rows.push([name, va, vb, "BEDA"]);
    continue;
  }
  rows.push([name, va, vb, "ok"]);
}

const pad = (s, n) => String(s).padEnd(n);
console.log("audit:slices — pasangan metadata + sinkronisasi versi\n");
for (const [name, va, vb, status] of rows) {
  console.log(`  ${pad(name, 20)} ${pad(va, 9)} ${pad(vb, 9)} ${status}`);
}
console.log(`\n  ${rows.length} slice diperiksa, ${problems.length} bermasalah`);

if (problems.length) {
  console.error("\nGAGAL:");
  for (const p of problems) console.error(`  • ${p}`);
  process.exit(1);
}
