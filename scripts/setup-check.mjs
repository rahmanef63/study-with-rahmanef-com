#!/usr/bin/env node
// `npm run setup:check` — what is actually configured in production, and the
// exact command to fix whatever is not.
//
// WHY THIS EXISTS INSTEAD OF PLACEHOLDER VALUES. The owner asked to "set
// everything with placeholders and swap the env later". For every one of the
// three outstanding items a placeholder is worse than leaving it empty:
//
//   AUTH_GOOGLE_SECRET  Convex does the OAuth token exchange, so a placeholder
//                       does not defer the work — it GUARANTEES nobody can log
//                       in, on a live site, immediately. Empty-or-stale might
//                       still be working; a placeholder cannot be.
//   Discord webhook     A fake-but-valid-shaped URL passes validation, so the
//                       UI would report "webhook configured" while every
//                       announcement silently failed to deliver
//                       (posts/discord.ts logs and swallows). A quiet lie in
//                       the console is the kind that survives for months.
//   e2e/.auth/user.json A fake session registers the `chromium-auth` project
//                       and every member spec then fails against a logged-out
//                       browser — turning a clean SKIP into a wall of red that
//                       hides real regressions.
//
// So: nothing is faked. This reports the truth and hands over the command.
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

const ORIGIN = process.env.SITE_ORIGIN ?? "https://study-with.rahmanef.com";
const ok = (s) => `[32m${s}[0m`;
const bad = (s) => `[31m${s}[0m`;
const dim = (s) => `[2m${s}[0m`;

function convex(args) {
  try {
    return execFileSync("npx", ["convex", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  } catch {
    return null;
  }
}

const problems = [];
function line(label, pass, detail, fix) {
  console.log(` ${pass ? ok("✔") : bad("✘")} ${label.padEnd(34)} ${detail}`);
  // Deduped: two failing rows for the same community share one fix, and a
  // checklist that repeats itself reads as longer than the work actually is.
  if (!pass && fix && !problems.includes(fix)) problems.push(fix);
}

console.log(`\nKesiapan produksi — ${ORIGIN}\n`);

// ── 1. Convex env ──────────────────────────────────────────────────────────
// Names only. A name proves the variable EXISTS, never that its value is
// current — which is exactly the gap after a Google Console rotation.
const envList = convex(["env", "list", "--prod"]) ?? "";
const names = new Set(envList.split("\n").map((l) => l.split("=")[0].trim()).filter(Boolean));
for (const key of ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET", "JWKS", "JWT_PRIVATE_KEY", "SITE_URL"]) {
  line(
    `env ${key}`,
    names.has(key),
    names.has(key) ? dim("terpasang") : bad("HILANG"),
    `npx convex env set ${key} '<nilai>' --prod`
  );
}

const siteUrl = (convex(["env", "get", "SITE_URL", "--prod"]) ?? "").trim();
line(
  "SITE_URL cocok dengan origin",
  siteUrl === ORIGIN,
  siteUrl === ORIGIN ? dim(siteUrl) : bad(`${siteUrl || "kosong"} ≠ ${ORIGIN}`),
  `npx convex env set SITE_URL '${ORIGIN}' --prod`
);

// ── 2. Login, end to end ───────────────────────────────────────────────────
// The one thing this script CANNOT do: prove the secret is current. The token
// exchange only happens after a human picks a Google account. All it can say is
// that the page renders and the button is there.
const masuk = await fetch(`${ORIGIN}/masuk`).then((r) => r.text()).catch(() => "");
line("/masuk merender tombol Google", /google/i.test(masuk), dim("halaman 200"), null);
console.log(
  dim(
    "   ↳ secret yang basi hanya ketahuan saat login sungguhan. Buka " +
      `${ORIGIN}/masuk dan coba sekali.`
  )
);

// ── 3. Discord, per community ──────────────────────────────────────────────
const raw = convex(["run", "--prod", "features/tenants/setupStatus:list", "{}"]);
if (raw === null) {
  line("status Discord", false, bad("gagal membaca"), "npx convex deploy --yes");
} else {
  for (const t of JSON.parse(raw)) {
    line(
      `${t.slug} · invite Discord`,
      t.hasDiscordInvite,
      t.hasDiscordInvite ? dim("terisi") : dim("kosong — tombol Discord disembunyikan"),
      `Kelola → Profil komunitas di ${ORIGIN}/k/${t.slug}/kelola`
    );
    line(
      `${t.slug} · webhook Discord`,
      t.hasDiscordWebhook,
      t.hasDiscordWebhook ? dim("terisi") : dim("kosong — pengumuman tidak diteruskan"),
      `Kelola → Profil komunitas di ${ORIGIN}/k/${t.slug}/kelola`
    );
  }
}

// ── 4. e2e session ─────────────────────────────────────────────────────────
line(
  "sesi e2e terekam",
  existsSync("e2e/.auth/user.json"),
  existsSync("e2e/.auth/user.json") ? dim("ada — spec member ikut jalan") : dim("belum — spec member di-SKIP"),
  "npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk"
);

if (problems.length === 0) {
  console.log(`\n${ok("Semua siap.")}\n`);
} else {
  console.log(`\n${problems.length} hal belum siap:\n`);
  for (const p of problems) console.log(`   ${p}`);
  console.log("");
}
