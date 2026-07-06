# STATUS — Multi-Agent Claim Board

> Protocol: [AGENTS.md](../AGENTS.md) §4. Claim BEFORE working. One row per assignment.
> Status flow: `open` → `claimed` → `in-progress` → `review` → `done` · or `blocked`.
> A claim is stale after 48h without commits — it may then be re-claimed.

## Assignments

| # | Area | Release | Depends on | Status | Agent | Branch | Last commit | Notes |
|---|---|---|---|---|---|---|---|---|
| 0 | Scaffold: `rahman-resources init`, convex-auth (google), theme-presets, responsive-dialog, feedback-states, `proxy.ts`, `convex/schema.ts` + `convex/_shared/auth.ts` per DATA-MODEL.md, seed mutation | v1 | — | done | alpha | main | 06c203c | **INTEGRATOR ONLY** — pushed to origin; tsc green; dashboard-shell deferred (see drift log); `_generated` committed w/ untyped api.d.ts, regenerates on first `npx convex dev` |
| 1 | `slices/tenants` — tenant profile, join, memberships, roles | v1 | #0 | done | beta | main | 342905c | 144-test suite + tsc green; request-form & approval UI deferred to #6 |
| 2 | `slices/courses` — course/module/lesson CRUD + lesson viewer | v1 | #0 | in-progress | gamma | main | 342905c | Review fix needed: protected ID lookups must authenticate before DB reads; public-read contract drift logged below |
| 3 | `slices/progress` — mark-complete, progress bars, course completion | v1 | #2 (barrel) | open | — | slice/progress | — | completion writes are idempotent |
| 4 | `slices/profiles` — minimal profile (username, displayName) | v1 | #0 | done | delta | main | 342905c | 144-test suite + tsc green; public page + badges deferred to #9 |
| 5 | `app/landing` — landing page + marketing chrome + e2e smoke | v1 | #1, #2 | in-progress | alpha | main | 2a6e491 | Cached active tenant/course catalog + tenant/course/lesson routes wired; tests, tsc, build green; e2e and progress wiring remain; **v1 LAUNCH gate** |
| 6 | `tenants` request form + `/admin` approval queue | v1.1 | #1 | open | — | slice/tenants-requests | — | evaluate rr `platform-admin` (contract-only scaffold) |
| 7 | `slices/resources` — resource board + suggestion box (submit→curate) | v1.1 | #1 | open | — | slice/resources | — | adapt rr `library`; install `rate-limit` |
| 8 | `slices/quiz` — MCQ builder + attempt + auto-grade | v1.1 | #2 | open | — | slice/quiz | — | P0: answers never reach client pre-submit |
| 9 | `profiles` public page + badge wall `/u/[username]` | v1.1 | #3, #4 | open | — | slice/profiles-public | — | evaluate rr `profile` |
| 10 | `slices/announcements` — in-app + Discord webhook action | v1.1 | #1 | open | — | slice/announcements | — | P0: webhook URL server-only; evaluate `notifications-center` |
| 11 | ops: production deploy sehat — Convex self-hosted, OAuth Google, seed, domain (jalankan docs/DEPLOY.md A–E) | v1 | #0 | open | vps | — | — | agent di VPS (Claude Code); laporan via chat; secrets tidak pernah keluar server; lihat AGENT-PROMPTS "Prompt — vps" |

## Proposals (shared-surface changes — integrator applies)

_none yet_

| Date | From | File(s) | Proposal | Resolution |
|---|---|---|---|---|

## Blocked / drift log

| Date | Agent | Issue | Resolution |
|---|---|---|---|
| 2026-07-06 | alpha | rr `dashboard-shell` facade is not liftable standalone — it imports the full superspace workspace foundation (AppSidebar, Workspace/Guest providers, onboarding, theme). Too heavy for charity v1. | Integrator decision: slice dropped from #0. `/t/[slug]` shell will be a minimal app-level layout built at #5 with shadcn primitives; revisit a full lift post-v1. `responsive-dialog` kept (component copied into the slice); `defineFeature` sanitized to `shared/features/defineFeature.ts` (no zod). |
| 2026-07-06 | alpha | Security P0 says an authz helper is first in every public Convex handler, while R2/R3/R4 and DATA-MODEL require anonymous tenant/course etalase queries. Courses also has protected ID lookups before auth. | ✅ RESOLVED 2026-07-06 by alpha: anonymous public-read exception added to AGENTS.md §6 (`public*` naming + active/published-only via index + safe projection). Remaining for gamma: move protected ID lookups behind `requireUser` before #2 reaches review. |
