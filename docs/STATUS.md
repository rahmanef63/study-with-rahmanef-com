# STATUS — Multi-Agent Claim Board

> Protocol: [AGENTS.md](../AGENTS.md) §4. Claim BEFORE working. One row per assignment.
> Status flow: `open` → `claimed` → `in-progress` → `review` → `done` · or `blocked`.
> A claim is stale after 48h without commits — it may then be re-claimed.

## Assignments

| # | Area | Release | Depends on | Status | Agent | Branch | Last commit | Notes |
|---|---|---|---|---|---|---|---|---|
| 0 | Scaffold: `rahman-resources init`, convex-auth (google), theme-presets, responsive-dialog, feedback-states, `proxy.ts`, `convex/schema.ts` + `convex/_shared/auth.ts` per DATA-MODEL.md, seed mutation | v1 | — | done | alpha | main | 06c203c | **INTEGRATOR ONLY** — pushed to origin; tsc green; dashboard-shell deferred (see drift log); `_generated` committed w/ untyped api.d.ts, regenerates on first `npx convex dev` |
| 1 | `slices/tenants` — tenant profile, join, memberships, roles | v1 | #0 | done | beta | main | 342905c | 144-test suite + tsc green; request-form & approval UI deferred to #6 |
| 2 | `slices/courses` — course/module/lesson CRUD + lesson viewer | v1 | #0 | done | gamma | main | — | authz-order fix landed at review (design: gamma; applied by alpha — worker session edits never reached the folder); anonymous etalase whitelisted per AGENTS.md §6 |
| 3 | `slices/progress` — mark-complete, progress bars, course completion | v1 | #2 (barrel) | done | epsilon | main | — | 27 files, 18 specs (167 total green), authz-before-read pattern, double idempotency; api.d.ts regenerated as loose fallback — typed variant returns at next real `convex dev/deploy` |
| 4 | `slices/profiles` — minimal profile (username, displayName) | v1 | #0 | done | delta | main | 342905c | 144-test suite + tsc green; public page + badges deferred to #9 |
| 5 | `app/landing` — landing page + marketing chrome + e2e smoke | v1 | #1, #2 | done | alpha | main | bf4ee89 | Routes + progress slots wired (completionSlot di player, progressSlot + completedLessonIds di overview, member-gated mount); sisa: e2e smoke + verifikasi produksi; **v1 LAUNCH gate** |
| 6 | `tenants` request form + `/admin` approval queue | v1.1 | #1 | in-progress | beta | — | — | pre-claimed (wave v1.1); reject = status `suspended` (schema has no rejected literal) |
| 7 | `slices/resources` — resource board + suggestion box (submit→curate) | v1.1 | #1 | in-progress | epsilon | — | — | pre-claimed; anti-spam = DATA-MODEL pending-count guard (NO rr rate-limit dependency) |
| 8 | `slices/quiz` — MCQ builder + attempt + auto-grade | v1.1 | #2 | in-progress | gamma | — | — | pre-claimed; P0: answers never reach client pre-submit; standalone views, editor integration by alpha |
| 9 | `profiles` public page + badge wall `/u/[username]` | v1.1 | #3, #4 | in-progress | delta | — | — | pre-claimed; public* etalase queries per §6, safe projection asserted in tests |
| 10 | `slices/announcements` — in-app + Discord webhook action | v1.1 | #1 | in-progress | zeta | — | — | pre-claimed; P0 webhook server-only (internal action); scheduler pattern |
| 11 | ops: production deploy sehat — Convex self-hosted, OAuth Google, seed, domain | v1 | #0 | done | vps | main | d894356 | A–E verified; live: https://study-with.rahmanef.com; 2 auth defects fixed (stale AUTH_GOOGLE_SECRET, missing auth.config.ts); seed done — Rahman = platform admin + owner `belajar-ai` |
| 12 | ops: ROTASI SECRET — Convex admin key, JWT_PRIVATE_KEY/JWKS, AUTH_GOOGLE_SECRET (terekspos di chat sesi vps) | v1 | #11 | open | vps | — | — | **URGENT** — jalankan di VPS; JWT rotate = logout sesi aktif (login ulang saja); hapus juga .env.local berisi admin key di laptop |
| 13 | e2e smoke Playwright (login → join → lesson → complete → progress) terhadap staging/prod | v1.1 | #11 | open | — | — | — | deferred dari #5 (drift log); v1 launch memakai smoke-lite: audit vps A–E + login riil Rahman + HTTP checks |
| 14 | ops: deploy v1.1 + verifikasi rute + seed check (SETELAH merge wave v1.1) | v1.1 | #6–#10, #12 | open | vps | — | — | prompt final di AGENT-PROMPTS; jalan terakhir setelah alpha merge & Rahman push |

## Proposals (shared-surface changes — integrator applies)

_none yet_

| Date | From | File(s) | Proposal | Resolution |
|---|---|---|---|---|

## Blocked / drift log

| Date | Agent | Issue | Resolution |
|---|---|---|---|
| 2026-07-06 | alpha | rr `dashboard-shell` facade is not liftable standalone — it imports the full superspace workspace foundation (AppSidebar, Workspace/Guest providers, onboarding, theme). Too heavy for charity v1. | Integrator decision: slice dropped from #0. `/t/[slug]` shell will be a minimal app-level layout built at #5 with shadcn primitives; revisit a full lift post-v1. `responsive-dialog` kept (component copied into the slice); `defineFeature` sanitized to `shared/features/defineFeature.ts` (no zod). |
| 2026-07-06 | alpha | Security P0 says an authz helper is first in every public Convex handler, while R2/R3/R4 and DATA-MODEL require anonymous tenant/course etalase queries. Courses also has protected ID lookups before auth. | ✅ RESOLVED 2026-07-06 by alpha: anonymous public-read exception added to AGENTS.md §6 (`public*` naming + active/published-only via index + safe projection). Remaining for gamma: move protected ID lookups behind `requireUser` before #2 reaches review. |
| 2026-07-06 | vps | Boundary violation: vps committed & pushed d894356 (auth.config.ts + _generated regen) — its contract allowed only `git pull --ff-only`. | Post-hoc review by alpha: content clean (no secrets, correct provider registry, typed api incl. progress), accepted. AGENTS.md §4 amended: narrow deploy-blocking-hotfix exception with mandatory alpha post-review. |
| 2026-07-06 | vps | Secret exposure: Convex admin key + JWT_PRIVATE_KEY leaked by vps filter mistakes; AUTH_GOOGLE_SECRET pasted by Rahman in chat. | Rotation tracked as row #12 (URGENT, runs on VPS). Reminder reinforced: reports reference env var NAMES only. |
