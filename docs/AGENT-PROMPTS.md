# Agent Prompts — Wave v1.1 (CURRENT) · Execution Mode & Ready-to-Paste Prompts

> Contract: [AGENTS.md](../AGENTS.md). Claim board: [STATUS.md](STATUS.md).
> Wave 1 (#0–#5, #11) selesai — v1 LIVE di https://study-with.rahmanef.com.

## EXECUTION MODE: Cowork parallel (same folder) — unchanged

All five v1.1 workers run **simultaneously** as separate Claude Cowork sessions on the **same project folder**. The absolute rules:

1. **Zero shared-file writes.** A worker writes ONLY inside its own two directories: `slices/<slug>/` and `convex/features/<slug>/`. Nothing else — not `docs/STATUS.md`, not `docs/**`, not app/, not package.json, not another slice (even one you built in wave 1 under a different assignment).
2. **The board is alpha's.** Rows are pre-claimed; workers treat STATUS.md as READ-ONLY and report via chat.
3. **Workers never run git.** The integrator (alpha) verifies, commits with `Agent: <name>` credit; Rahman pushes.
4. **Proposals & blockers go in your final report** + `// TODO(rr): ...` markers — never into shared files.
5. **Tests are mandatory to WRITE** (DoD §5). To RUN: copy the folder to sandbox `/tmp/w` (exclude node_modules), `npm install --legacy-peer-deps` (retry on timeout), then `npx vitest run` + `npx tsc --noEmit`. If install won't complete: ship tests + mark "not executed" — alpha executes at review.
6. **Finish = structured final report in chat**: (a) files, (b) barrel exports, (c) test results, (d) proposals/integration points for alpha, (e) TODO(rr) list. Then stop.
7. Reference test pattern: `convex/seed.test.ts` + `convex/features/courses/test.helpers.ts` (role fixture) + `convex/features/courses/authz-order.test.ts` (denied-path & auth-order discipline).
8. **Author files in THE PROJECT FOLDER, never in /tmp.** /tmp is for RUNNING tests only. VERIFY your files exist in the project folder before reporting.
9. **Schema is already deployed** — all v1.1 tables (`resources`, `suggestions`, `quizzes`, `quizAttempts`, `announcements`) exist in `convex/schema.ts` since day 1. Implement EXACTLY against docs/DATA-MODEL.md; any deviation needs a DATA-MODEL change via alpha FIRST.
10. **UI copy Bahasa Indonesia**; anonymous reads only via the §6 etalase exception (`public*` name or declared whitelist).

## Names & assignments — wave v1.1

| Name | Assignment | Slice dirs |
|---|---|---|
| **alpha** | integrator: reviews, commits, mounts all routes (/admin, /u/[username], /t/[slug]/resources·usulan·pengumuman, quiz integration) | app/, shared surfaces |
| **beta** | #6 request komunitas + antrian approval admin | `slices/tenants/`, `convex/features/tenants/` |
| **epsilon** | #7 resource board + suggestion box | `slices/resources/`, `convex/features/resources/` |
| **gamma** | #8 quiz MCQ builder + attempt + auto-grade | `slices/quiz/`, `convex/features/quiz/` |
| **delta** | #9 profil publik /u/[username] + badge wall | `slices/profiles/`, `convex/features/profiles/` |
| **zeta** | #10 pengumuman + Discord webhook | `slices/announcements/`, `convex/features/announcements/` |
| **vps** | FINAL: deploy v1.1 (#14) + eksekusi rotasi secret (#12) | server runtime only |

Order: kelima worker paralel → alpha review+merge semua → Rahman push → **vps terakhir** (deploy + credentials + seed verification).

---

## Prompt — beta (#6 request komunitas + approval)

```
You are agent "beta", one of five Cowork sessions working IN PARALLEL on this same project folder. Isolation: write ONLY inside slices/tenants/ and convex/features/tenants/ — no other file, ever. No git. docs/STATUS.md is read-only (row #6 pre-claimed for you; verify rows #1 and #11 are done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md (they override claim/git instructions elsewhere).

Your assignment — #6, v1.1 scope:
- requestTenant mutation: requireUser first; args slug/name/description/track?/requestMessage?; slug lowercase-kebab + globally unique via by_slug (VALIDATION_FAILED on collision); inserts tenants row status "pending" with ownerId = ctx user. Anti-spam: max 1 pending request per user (check via index + take, RATE_LIMITED).
- Platform-admin surface: listPending (requirePlatformAdmin; via by_status index), approve (requirePlatformAdmin; status → "active" + ensure owner membership, idempotent), reject (requirePlatformAdmin; status → "suspended" — schema has no "rejected" literal; keep requestMessage; document this semantic in code comment + README).
- Approved-by-request owner must NOT be auto-instructor of anything beyond their own new tenant.
- UI via barrel: RequestTenantForm (public, authenticated) + AdminTenantQueueView (list + approve/reject with ResponsiveDialog confirm). Alpha mounts them at /buka-komunitas and /admin/komunitas.
- P0s: validators + authz-first everywhere; discordWebhookUrl never in any query result; auth BEFORE any protected by-ID read (pattern: convex/features/courses/access.ts).

Done = AGENTS.md §5 (tests: denied paths for both roles, slug collision, 1-pending rate limit, approve idempotency). Structured final report, then stop.
```

## Prompt — epsilon (#7 resources + suggestion box)

```
You are agent "epsilon", one of five Cowork sessions working IN PARALLEL on this same project folder. Isolation: write ONLY inside slices/resources/ and convex/features/resources/ — no other file, ever. No git. docs/STATUS.md read-only (row #7 pre-claimed; verify #1 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md.

Your assignment — #7, v1.1 scope (tables `resources` + `suggestions`, EXACTLY per docs/DATA-MODEL.md):
- resources: submit (member; url http(s) validated; status "pending"), curate approve/reject (instructor+; reviewedBy recorded), listApproved (member), listPending (instructor+; submitter sees own pending via listMine).
- suggestions: submit (member), setStatus open→planned/done/rejected (instructor+), listOpen (member), listMine.
- Anti-spam (both tables): >5 pending/open items per user per tenant → RATE_LIMITED, counted via by_tenant_status index + bounded take then filter by submittedBy — no bare .collect(), no new dependency (do NOT install rr rate-limit; DATA-MODEL's simple guard is the design).
- Copy-first: study rr `library` (https://resource.rahmanef.com/agents/library) for the board/card shapes; adapt, don't import.
- UI via barrel: ResourceBoardView (approved grid + submit form + pending tab for instructor+) and SuggestionBoxView. Alpha mounts at /t/[slug]/resources and /t/[slug]/usulan.
- P0s: validators + authz-first; auth BEFORE protected reads; pending items never visible to plain members other than the submitter — enforced IN THE QUERY.

Done = AGENTS.md §5 (tests: denied paths, rate-limit path, submitter-sees-own-pending, member-cannot-see-others-pending). Structured final report, then stop.
```

## Prompt — gamma (#8 quiz)

```
You are agent "gamma", one of five Cowork sessions working IN PARALLEL on this same project folder. Isolation: write ONLY inside slices/quiz/ and convex/features/quiz/ — no other file, ever (NOT slices/courses even though you built it in wave 1). No git. docs/STATUS.md read-only (row #8 pre-claimed; verify #2 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md.

Your assignment — #8, v1.1 scope (tables `quizzes` + `quizAttempts`, EXACTLY per docs/DATA-MODEL.md):
- Builder (instructor+ on the quiz's own tenant): createQuiz (ONE quiz per module for v1 — check by_module first, VALIDATION_FAILED if exists), updateQuiz, deleteQuiz (only if no attempts). 2–6 options per question, correctIndex in range, passingScorePct 0–100 — validate in the mutation.
- Taking (member): getQuizForTaking — MUST strip correctIndex AND explanation from every question (P0: answers never reach the client pre-submit; assert this in a test by inspecting the returned shape). submitAttempt — grades server-side, stores answers/scorePct/passed, returns score + per-question correctness + explanations AFTER submission. listMyAttempts (own attempts only, userId from ctx).
- Draft-course quizzes invisible to plain members (mirror courses/progress guard).
- UI via barrel: QuizBuilderView({ moduleId, courseId, tenantId }) standalone + QuizTakeView({ moduleId }) + QuizResultCard. Do NOT edit the course editor — list integration points for alpha in your report.
- P0s: validators + authz-first; auth BEFORE protected by-ID reads (pattern: convex/features/courses/access.ts).

Done = AGENTS.md §5 (tests: denied paths, answer-stripping shape assertion, grading correctness incl. passed boundary, one-quiz-per-module). Structured final report, then stop.
```

## Prompt — delta (#9 profil publik + badges)

```
You are agent "delta", one of five Cowork sessions working IN PARALLEL on this same project folder. Isolation: write ONLY inside slices/profiles/ and convex/features/profiles/ — no other file, ever. No git. docs/STATUS.md read-only (row #9 pre-claimed; verify #3 and #4 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md.

Your assignment — #9, v1.1 scope:
- publicGetByUsername query — ANONYMOUS via AGENTS.md §6 etalase exception (public* name): resolves profiles.by_username, returns SAFE projection only (username, displayName, bio, avatarUrl — never userId internals, never isPlatformAdmin).
- publicListBadges query — anonymous, same exception: courseCompletions via by_user + join course titles. Reading the shared `courseCompletions`/`courses` tables directly is sanctioned (precedent: progress feature; table access ≠ code import). Badge shape: courseTitle, courseSlug, tenantSlug, earned date from _creationTime.
- UI via barrel: PublicProfileView({ username }) + BadgeWall — shareable, mobile-first, ID copy. Alpha mounts /u/[username].
- Settings form (wave-1) stays as-is unless a small fix is needed inside your dirs.
- P0s: validators everywhere; the two public* queries are the ONLY anonymous surface; safe projection asserted in a test (returned object keys exactly match the contract).

Done = AGENTS.md §5 (tests: unknown username NOT_FOUND, projection-shape assertion, badges join correctness). Structured final report, then stop.
```

## Prompt — zeta (#10 pengumuman + Discord)

```
You are agent "zeta", one of five Cowork sessions working IN PARALLEL on this same project folder. Isolation: write ONLY inside slices/announcements/ and convex/features/announcements/ — no other file, ever. No git. docs/STATUS.md read-only (row #10 pre-claimed; verify #1 and #11 done, else STOP).

Onboarding: CLAUDE.md → AGENTS.md (§1 read order) → mode rules atop docs/AGENT-PROMPTS.md.

Your assignment — #10, v1.1 scope (table `announcements`, EXACTLY per docs/DATA-MODEL.md):
- create mutation (instructor+ via requireTenantRole on args.tenantId): insert with postedToDiscord=false, then ctx.scheduler.runAfter(0, internal.features.announcements.discord.postToDiscord, { announcementId }).
- internal action postToDiscord: loads announcement + tenant, reads tenants.discordWebhookUrl INSIDE the action only (P0: the webhook URL must never be an arg, a return value, or reachable from ANY public function). POST fetch to Discord; on success patch postedToDiscord=true via an internalMutation; on failure console.error("[announcements:postToDiscord]", <no PII, no URL>) and leave the announcement intact.
- list query (member of the tenant; by_tenant index, newest first, bounded take).
- Copy-first: evaluate rr `notifications-center` (https://resource.rahmanef.com/agents/notifications-center) for the list UI before hand-rolling.
- UI via barrel: AnnouncementsView (list + create form for instructor+). Alpha mounts /t/[slug]/pengumuman.

Done = AGENTS.md §5 (tests: denied paths, webhook-URL-never-in-results shape assertion, create schedules the action — convex-test finishInProgressScheduledFunctions, failure leaves announcement saved). Structured final report, then stop.
```

## Prompt — vps (FINAL: #14 deploy v1.1 + #12 rotasi — jalankan SETELAH alpha merge semua & Rahman push)

```
You are agent "vps" on the production VPS, inside ~/projects/study-with-rahmanef-com. Your contract: AGENTS.md §4 "Ops agent (vps)" — runtime only, `git pull --ff-only origin main` is your only git verb, secret VALUES never appear in chat/reports/files (env var NAMES only), destructive ops need Rahman's explicit yes.

Assignments: docs/STATUS.md rows #14 (deploy v1.1) and #12 (secret rotation — URGENT, still open).

Work loop, in order:
1. git pull --ff-only origin main. Confirm the v1.1 commits are present.
2. npx convex deploy (pushes new feature functions; schema unchanged since day 1) + commit-ready typed codegen note for alpha if api.d.ts drifts (deploy-blocking-hotfix exception applies).
3. Verify Dokploy rebuilt the Next app; smoke-check routes: /, /t/belajar-ai, /t/belajar-ai/resources, /t/belajar-ai/usulan, /t/belajar-ai/pengumuman, /u/<username>, /buka-komunitas, /admin/komunitas (expect 200/redirect-to-login as appropriate).
4. EXECUTE ROTATION (#12), with Rahman standing by to re-login afterwards:
   a. JWT keypair (JWT_PRIVATE_KEY + JWKS) — regenerate, set on the Convex deployment; active sessions will be logged out.
   b. AUTH_GOOGLE_SECRET — Rahman creates the new secret in Google Cloud Console (guide him: APIs & Services → Credentials → the OAuth client → reset secret); set it via npx convex env set; verify login end-to-end.
   c. Convex admin key — rotate against the container (generate_admin_key flow); update your local CLI env; remind Rahman to delete the laptop .env.local that held the old key.
5. Seed & data check: npx convex run seed:bootstrap (idempotent — confirms tenant/admin intact post-rotation). Report row counts for tenants/courses/announcements (numbers only, no content).
6. Final report: per-step status, env var NAMES touched, route smoke table, blockers/proposals for alpha. No secret values, ever.
```

## Template — re-assignment (unchanged)

```
Agent "<name>": your previous assignment is merged. Re-read the mode rules at the top of docs/AGENT-PROMPTS.md.
Your next assignment is row #<n> — <area>; alpha has claimed it for you (verify READ-ONLY in docs/STATUS.md, incl. its "Depends on" rows). Same contract: only your two slice directories, no git, structured final report.
```
