# e2e — Playwright suite (anon-first, auth on demand)

Two halves, one config:

| File | Project | Needs a session? | What it covers |
|---|---|---|---|
| `smoke.anon.spec.ts` | `chromium` | no | 18 specs — every surface a stranger can reach |
| `member.auth.spec.ts` | `chromium-auth` | **yes** | A1–A5 — session, notifikasi, cari, lesson player, diskusi |
| `library.auth.spec.ts` | `chromium-auth` | **yes** | B1–B7 — materi library, permalink body, skills library, prompt panel |
| `kelola.auth.spec.ts` | `chromium-auth` | **yes** | C1–C4 — the authoring console and the block-editor route |
| `helpers.ts` | — | — | shared constants + assertions (not a spec, never collected) |

The anon half is read-only and safe against production. The authed half is
read-only too — it navigates, filters and sorts, and opens dialogs it closes
with Escape; it never presses Simpan / Terbitkan / Hapus and never types into
the block editor (which autosaves). **No spec in this folder writes data, so no
spec needs a cleanup step.** Keep it that way.

## Record the session

```bash
npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk
```

Sign in with Google in the window that opens, then close it.

**THE STATE IS GOOD FOR ABOUT ONE JWT LIFETIME — RUN THE SUITE RIGHT AFTER
RECORDING IT.** This was measured on 2026-08-16, not assumed, and it is the
opposite of what this file used to claim ("record once, that is the whole
refresh procedure"):

- `@convex-dev/auth` keeps TWO values in localStorage: a short-lived JWT and a
  refresh token. The recorded file is a frozen copy of both.
- While the JWT is valid, every spec works — 16 parallel contexts replay the
  same still-good token and none of them needs to refresh. A full run in that
  window went 14/16, and both failures were real product drift.
- Once the JWT expires, each context tries to REFRESH. The refresh token is
  single-use and rotates server-side: the first context to spend it invalidates
  the copy every other context (and every future run) is holding. The next full
  run went 2 passed / 11 failed — not a flake, not eleven regressions, one dead
  token.
- `fullyParallel: true` makes this loud rather than gradual, and `--workers=1`
  does NOT help: Playwright builds a fresh context per test, so each one replays
  the same frozen token regardless of ordering.

So: record, then run. If a run comes back mostly red, re-record before believing
a single one of those failures.

**BEFORE you re-record, read the failure snapshot** (`error-context.md` next to
the trace). If it contains a `Kelola` link, the session was ALIVE and the spec
is what is wrong — that button only renders for an authenticated owner or
instructor. A1 has now failed twice for reasons that had nothing to do with
expiry, and both times the snapshot said so.

**Playwright's own codegen may not survive Google sign-in.** It drives Chromium
with automation flags that Google's account chooser regularly refuses. On the
VPS the practical route is the hardened-Firefox profile behind `mso camoufox`
(it exists for exactly this class of problem): sign in there, then lift the two
`__convexAuth*` keys for the app origin out of
`<profile>/storage/default/https+++<host>/ls/data.sqlite` into the storageState
shape (`{cookies: [], origins: [{origin, localStorage: [{name, value}]}]}`).
Cookies are not needed — SSR here is permanently anonymous, so the session lives
entirely in localStorage. Never print those values; write them straight to the
gitignored file.

`playwright.config.ts` registers the `chromium-auth` project **only when
`e2e/.auth/user.json` exists**. Without it, `npx playwright test` runs anon-only
and stays green — the 16 authed specs are not skipped, they are not collected at
all, which is what makes the suite safe in CI (CI never has a session). Verify
either state with `npx playwright test --list`.

`e2e/.auth/` is gitignored: the file holds live session tokens. Never commit it,
never paste its contents into chat.

## Until that command is run, these surfaces are UNVERIFIED

Everything behind membership. Anonymously they are provably a gate (specs 13–17
assert exactly that), and beyond the gate nothing has ever been exercised by a
browser:

- **/materi** — the library list, the count, the sort control, the filter box.
- **a materi permalink's BODY** — anon only ever sees the title + join CTA.
- **/skills** — the library and its server-side search over prompt text.
- **a skill's PROMPT panel** — and therefore the copy button.
- **Kelola › Kelas** — the course drill-down and the materi placement editor.
- **Kelola › Skills** — the whole authoring path for the prompt library.
- **/k/…/kelola/materi/&lt;lessonId&gt;** — the block editor route.
- **A1–A5** — member session, notifikasi, cari, lesson player, diskusi.

Two more stay dark even WITH a session, and no recording fixes them:

- **every skill surface** (anon 16, B7) — the skills library is empty by design,
  so there is no published skill to open. These specs skip with that reason and
  start guarding the prompt leak by themselves the day the first skill ships.
- **/mulai, the assessment** (anon 18) — skips while the route 404s, then
  asserts for real. It is the only spec that measures a touch target, at 390px,
  because a stranger on a phone finishing it without logging in IS the feature.

## Run it

```bash
# local: terminal 1
npm run dev
# terminal 2 — default baseURL http://localhost:3000
npx playwright test

# staging / prod (anon read-only)
E2E_BASE_URL=https://study-with.rahmanef.com npx playwright test
```

`npm run e2e` is the same as `npx playwright test`.
HTML report: `npx playwright show-report e2e/playwright-report`
(artifacts live under `e2e/` and are gitignored).

## Configuration (env)

| Var | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | suite target |
| `E2E_TENANT` | `belajar-ai` | seeded community slug |
| `E2E_COURSE` | `dasar-ai` | seeded course slug |
| `E2E_USERNAME` | `abdurrahman-fakhrul` | a real public profile username |
| `E2E_ALLOW_PROD_AUTH` | _(unset)_ | `1` = let the AUTHED suite touch prod (refused by default; still read-only) |

## Data policy (MANDATORY)

- **Anon specs: read-only, whitelist only.** They touch the §6 etalase surface
  (`public*`) and nothing else. Never add a spec that mutates production.
- **Authed specs: read-only, and prod is refused** unless `E2E_ALLOW_PROD_AUTH=1`
  (`helpers.ts` → `DENY_PROD_AUTH`, asserted in every `*.auth.spec.ts`
  `beforeEach`). If a future spec must write, it cleans up after itself in the
  same test and keeps that guard.
- A spec that needs a fixture it cannot create **skips with a reason**. It never
  invents one, and it never goes red because someone else's seed is empty.

## What the specs assert, and where the copy comes from

Selectors are role/text-based over the Bahasa Indonesia copy, so a spec breaks
on purpose when the copy contract changes. That is the deal — and it has already
been paid twice: A1's `"Mulai belajar di sini."` and A4's
`section[aria-label="Modul"]` were asserting strings the product had deleted, so
both were failing against every build until they were repointed
(`app/k/[slug]/page.tsx`, `course-overview.tsx` → `aria-label="Silabus"`).

| Spec | Marker | SSOT |
|---|---|---|
| anon 1 | community `<h1>` + a `/kelas/` link | `app/k/[slug]/layout.tsx` · `page.tsx` |
| anon 2–3 | course links + `og:title` in the HTML | `app/k/[slug]/kelas/[courseSlug]/page.tsx` |
| anon 4 | "Masuk dengan Google" | `app/masuk` |
| anon 5 | `@<username>` | `slices/profiles` |
| anon 6 | "Masuk untuk mengelola" / "Khusus pengajar" | `kelola-console.tsx` |
| anon 7 | "Gabung komunitasnya dulu" + 0 iframes | `kelas/_components/lesson-surface.tsx` |
| anon 13 | "Perpustakaan materi komunitas hanya terbuka untuk anggota." + noindex | `app/k/[slug]/materi/page.tsx` |
| anon 14 | "Kumpulan prompt komunitas hanya terbuka untuk anggota." + 0 `section[aria-label="Prompt"]` | `app/k/[slug]/skills/page.tsx` |
| anon 15–16 | `<h1>` present in the SERVER html; sitemap supplies the slug | `materi/[lessonSlug]/page.tsx` · `app/sitemap.ts` |
| anon 17 | wrong-kind slug 307s to the canonical route | both permalink pages |
| anon 18 | no gate, a 44px control, click does not bounce to /masuk | `/mulai` (assessment) |
| A1 | "Kamu sudah bergabung" | `slices/tenants/config/labels.ts` |
| A4 | `section[aria-label="Silabus"]` | `slices/courses/components/course-overview.tsx` |
| B1–B4 | "N materi", `role=group[Urutkan]`, "Tidak ada materi yang cocok dengan…" | `slices/materi/config/copy.ts` |
| B5–B7 | "Belum ada skill di sini", "Ketik minimal 2 huruf.", `section[aria-label="Prompt"]` | `slices/materi/config/copy.ts` |
| C1–C3 | `role=tablist[Menu kelola]`, "Skill baru", "Kelola Kelas", "Silabus", "Tambah materi" | `kelola-console.tsx` · `slices/courses/config/copy.ts` |
| C4 | "Editor materi" + "Tersimpan", and NO prompt field on a materi | `components/editor/materi-editor.tsx` · `skill-prompt-panel.tsx` |

Every spec also asserts **no-crash**: the Next.js overlay AND `app/error.tsx`
("Ada yang tidak beres") both count as a crash. The anon specs additionally
require an empty console/pageerror log, with one allowlisted browser-level
rejection — `Transition was skipped`, which the View Transitions API throws when
a navigation interrupts a transition (`app/layout.tsx` wraps the app in React's
`<ViewTransition>`); it made spec 14 flaky before it was listed.

## Skip semantics — read this before "fixing" a skip

A skipped spec here is a **statement about the deployment**, not a disabled
test. Each one names its condition: no session (project not registered), prod
refused, no published skill, empty library, `/mulai` not deployed, or the
recorded account is not an instructor in this community (C1–C4 — a plain member
correctly sees "Khusus pengajar", which is not a failure). Make the condition
false and the spec runs; nothing needs to be re-enabled by hand.
