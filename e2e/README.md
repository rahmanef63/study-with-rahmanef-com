# e2e — Playwright smoke suite (anon-first, auth-ready)

Smoke suite over the **desktop OS shell** (deep-link windows, not route pages —
see `AGENTS.md` §0 + `docs/UI-UX-PRD.md` §3). Every spec runs **anonymously**
and **read-only** — safe to run against production.

## Prerequisites

- `@playwright/test` is already in devDependencies (installed by alpha).
- Browsers, once: `npx playwright install chromium`

## How to run — local

```bash
# terminal 1 — app (needs Convex dev / a valid env)
npm run dev

# terminal 2 — suite (default baseURL http://localhost:3000)
npx playwright test
```

## How to run — staging / prod

```bash
# staging (AGENTS.md §4 flow: push main:staging → verify → main)
E2E_BASE_URL=https://<staging-host> npx playwright test

# production
E2E_BASE_URL=https://study-with.rahmanef.com npx playwright test
```

Windows PowerShell: `$env:E2E_BASE_URL="https://study-with.rahmanef.com"; npx playwright test`

npm scripts PROPOSED to alpha (package.json = shared surface, zeta does not
touch it): `"e2e": "playwright test"` and
`"e2e:staging": "E2E_BASE_URL=https://study-with.rahmanef.com playwright test"`.

## Configuration (env)

| Var | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:3000` | suite target |
| `E2E_TENANT` | `belajar-ai` | seeded community slug |
| `E2E_COURSE` | `dasar-ai` | seeded course slug |
| `E2E_USERNAME` | `abdurrahman-fakhrul` | a real public profile username in prod (vps proposal 2026-07-16) |
| `E2E_ALLOW_PROD_AUTH` | _(unset)_ | `1` = let the authed suite touch prod (DENIED by default; still read-only) |

HTML report: `npx playwright show-report e2e/playwright-report`
(artifacts are written inside `e2e/` and already gitignored via `e2e/.gitignore`).

## Data policy (MANDATORY)

- **Anon read-only.** Specs only touch the §6 etalase surface (`public*` /
  whitelist) — no sign-in, no mutations, no pressing buttons that write data.
  **Never add a spec that mutates production.**
- Authenticated specs (future) may only target **local/staging**.
- `e2e/.auth/user.json` (the recorded storage state) holds a live session token —
  gitignored; never commit it or paste it into chat.

## Run authenticated — ACTIVE since v1.8 (#40)

Google OAuth is **not** automated in CI (ToS + bot detection). The pattern used:
record the storage state manually once, then reuse it through a Playwright project.

1. `npx playwright codegen --save-storage=e2e/.auth/user.json http://localhost:3000/masuk`
   → sign in manually (Google) in the window that opens, then close it.
2. Done. The `chromium-auth` project registers AUTOMATICALLY as soon as the state
   file exists (no file → `playwright test` stays anon-only; CI never has state).
3. Member specs: `e2e/member.auth.spec.ts` (A1–A5: live session, notification
   inbox, member search, lesson player + discussion, cross-device resume). All
   **read-only**; **prod is DENIED** unless `E2E_ALLOW_PROD_AUTH=1`.
4. Session expired → spec A1 fails → repeat step 1 (that is the entire refresh).

## Spec ↔ copy SSOT map

Selectors are role/text-based over the Indonesian copy. If the copy changes, the
specs fail on purpose — update them together with their SSOT:

| Spec | Marker | SSOT |
|---|---|---|
| 1 boot | "Komunitas belajar AI · Bahasa Indonesia" | `slices/os-shell/apps/beranda-app.tsx` |
| 2 komunitas | "Mulai belajar di sini." · "Login untuk gabung" · "Sumber & usulan" | `komunitas-app.tsx` · `slices/tenants/config/labels.ts` |
| 3 kelas | eyebrow "Kelas" · `section[aria-label="Modul"]` | `slices/courses/config/copy.ts` |
| 4 masuk | button "Masuk dengan Google" | `masuk-app.tsx` |
| 5 profil | "Profil anggota" · `@<username>` · `section[aria-label="Lencana Kelas"]` | `profil-app.tsx` · `slices/profiles/config/public-labels.ts` |
| 6 kelola | "Masuk untuk mengelola" (anon gate) | `kelola-app.tsx` |
| 7 lesson anon | spec 3 etalase + "Login untuk gabung" + `iframe` count 0 | `kelas-app.tsx` (member gate) · `slices/tenants/config/labels.ts` |
| 8 sertifikat | `/tidak ditemukan/i` — **fixme**, waiting on mounting #24 | `profil-app`/CertificateView (not mounted yet) |
| 9 usulan anon | login gate `/masuk untuk\|login untuk\|silakan login/i` — **test.fail** (open defect) | `resources-app.tsx` (no anon branch yet) |

Every spec also asserts **no-crash**: the Next.js overlay AND the
`app/error.tsx` page ("Ada yang tidak beres") both count as a crash.

## Run matrix & annotation status (wave v1.3, #25)

| Target | How | Notes |
|---|---|---|
| Local dev | `npm run dev` then `npx playwright test` | the main matrix; needs a valid Convex env + seed |
| Prod | `E2E_BASE_URL=https://study-with.rahmanef.com npx playwright test` | anon read-only ONLY; results are valid **after** the v1.3 deploy (#26) — before that, specs 2/6 still exercise the old build |

Live annotations (delete when they flip):

- **Spec 8 `test.fixme`** — the `/sertifikat/<id>` route is not mounted yet; turn
  it on after alpha's #24 integration.
- **Spec 9 `test.fail`** — open defect: `resources-app` has no anon branch → the
  suggestions query throws NOT_AUTHENTICATED all the way up to `app/error.tsx`.
  The spec asserts the INTENDED behavior (a login gate like `kelola-app`'s); once
  the gate lands, the spec turns into an "unexpected pass" → drop the annotation
  and tighten the selector to its SSOT copy.
