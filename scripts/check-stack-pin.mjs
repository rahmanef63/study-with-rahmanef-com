#!/usr/bin/env node
// `npm run check:stack-pin` — the stack lock in AGENTS.md §2, enforced instead
// of merely written down. SLICES.md "Pra-launch v1" named this command; it did
// not exist.
//
// The lock is not a style preference. Three of these entries are the shape of
// the whole app:
//   • NO Clerk        — auth is @convex-dev/auth, and the difference is not a
//                       swap: tokens live in localStorage, which is WHY server
//                       rendering here is permanently anonymous.
//   • proxy.ts        — Next 16 renamed middleware.ts. A file named
//                       middleware.ts is simply not loaded; a route "guard"
//                       there would be dead code that looks alive.
//   • Tailwind v4     — CSS-first @theme, no tailwind.config. A config file
//                       reappearing means someone is following v3 instructions.
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const fails = [];
const rows = [];

/** major yang diminta oleh rentang semver sederhana ("^16.0.0" → 16) */
const major = (range) => {
  const m = String(range ?? "").match(/(\d+)\./);
  return m ? Number(m[1]) : null;
};

const PINS = [
  ["next", 16],
  ["react", 19],
  ["react-dom", 19],
  ["tailwindcss", 4],
  ["@tailwindcss/postcss", 4],
];

for (const [name, want] of PINS) {
  const range = deps[name];
  if (!range) {
    fails.push(`${name} tidak terpasang — dikunci ke v${want} (AGENTS.md §2)`);
    rows.push([name, "—", `v${want}`, "HILANG"]);
    continue;
  }
  const got = major(range);
  const ok = got === want;
  if (!ok) fails.push(`${name} ${range} — dikunci ke v${want} (AGENTS.md §2)`);
  rows.push([name, range, `v${want}`, ok ? "ok" : "BEDA"]);
}

for (const name of ["convex", "@convex-dev/auth", "typescript"]) {
  const range = deps[name];
  if (!range) fails.push(`${name} tidak terpasang — bagian dari stack lock`);
  rows.push([name, range ?? "—", "wajib ada", range ? "ok" : "HILANG"]);
}

// Larangan, bukan pin.
const clerk = Object.keys(deps).filter((k) => /clerk/i.test(k));
if (clerk.length) fails.push(`Clerk terpasang (${clerk.join(", ")}) — auth WAJIB @convex-dev/auth`);
rows.push(["clerk", clerk.join(", ") || "tidak ada", "dilarang", clerk.length ? "ADA" : "ok"]);

if (existsSync(join(ROOT, "middleware.ts"))) {
  fails.push("middleware.ts ada — di Next 16 file ini TIDAK dimuat; pakai proxy.ts");
}
rows.push([
  "proxy.ts",
  existsSync(join(ROOT, "proxy.ts")) ? "ada" : "tidak ada",
  "wajib (bukan middleware.ts)",
  existsSync(join(ROOT, "proxy.ts")) ? "ok" : "HILANG",
]);
if (!existsSync(join(ROOT, "proxy.ts"))) fails.push("proxy.ts hilang — Next 16 memuatnya, bukan middleware.ts");

const twConfig = ["tailwind.config.js", "tailwind.config.ts", "tailwind.config.mjs"].filter((f) =>
  existsSync(join(ROOT, f))
);
if (twConfig.length) {
  fails.push(`${twConfig.join(", ")} ada — Tailwind v4 pakai @theme di app/globals.css, bukan file config`);
}
rows.push(["tailwind.config", twConfig.join(", ") || "tidak ada", "dilarang (v4)", twConfig.length ? "ADA" : "ok"]);

const pad = (s, n) => String(s).padEnd(n);
console.log("check:stack-pin — kunci stack AGENTS.md §2\n");
for (const [name, got, want, status] of rows) {
  console.log(`  ${pad(name, 22)} ${pad(got, 26)} ${pad(want, 28)} ${status}`);
}

if (fails.length) {
  console.error(`\nGAGAL — ${fails.length} pelanggaran:`);
  for (const f of fails) console.error(`  • ${f}`);
  console.error("\n  Menaikkan/mengganti dependensi butuh proposal di docs/STATUS.md dulu (AGENTS.md §2).");
  process.exit(1);
}
console.log("\n  Stack terkunci sesuai kontrak.");
