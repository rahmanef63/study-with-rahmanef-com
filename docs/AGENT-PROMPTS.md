# Agent Prompts — Execution Mode & Ready-to-Paste Prompts

> Contract: [AGENTS.md](../AGENTS.md). Claim board: [STATUS.md](STATUS.md).

## CURRENT EXECUTION MODE: Cowork parallel (same folder)

beta, gamma, and delta run **simultaneously** as separate Claude Cowork sessions on the **same project folder** (no worktrees, no clones). This is safe only because of one absolute rule — hold it without exception:

1. **Zero shared-file writes.** A worker writes ONLY inside its own two directories: `slices/<slug>/` and `convex/features/<slug>/`. Nothing else — not `docs/STATUS.md`, not `docs/**`, not app/, not package.json, not any file another session might touch. Zero shared writes = zero race conditions.
2. **The board is alpha's.** Your STATUS.md row is pre-claimed for you by the integrator before you start, and alpha updates it after review. Workers never edit STATUS.md.
3. **Workers never run git.** No commit, no branch, no push — the integrator (alpha) verifies, commits with `Agent: <name>` credit, and Rahman pushes.
4. **Proposals & blockers go in your final report** (chat message at the end of your session) plus `// TODO(rr): ...` markers at the call site — never into shared files.
5. **Tests are mandatory to WRITE** (DoD §5). To RUN them inside Cowork: copy the folder to sandbox `/tmp/w` (exclude node_modules), `npm install --legacy-peer-deps` there (re-run on timeout — progress persists), then `npx vitest run` and `npx tsc --noEmit`. If the install won't complete, ship the tests and mark "tests not executed" in your report — alpha executes at review.
6. **Finish = final report in chat**, structured: (a) files created/changed, (b) barrel exports (the contract), (c) test results or "not executed", (d) proposals for integrator, (e) TODO(rr) markers added. Then stop. Rahman relays the report to alpha.
7. Reference test pattern: `convex/seed.test.ts` (modules glob + convex-test + denied-path).

Wave 1 = beta + gamma + delta at once. epsilon (#3) starts only after gamma's barrel passes review; zeta and the v1.1 wave follow STATUS "Depends on".

## Names & assignments

| Name | Role | Assignments |
|---|---|---|
| **alpha** | INTEGRATOR — Rahman's main session; owns shared surfaces, board, review, commits | #0 ✅, #5 landing, all reviews |
| **beta** | worker | #1 tenants → #6 request+approval (v1.1) |
| **gamma** | worker | #2 courses → #8 quiz (v1.1) |
| **delta** | worker | #4 profiles → #9 public profile+badges (v1.1) |
| **epsilon** | worker | #3 progress (after #2 review) → #7 resources (v1.1) |
| **zeta** | worker (optional) | #10 announcements (v1.1) |
| **vps** | ops — Claude Code di server produksi | #11 production deploy sehat |

---

## Prompt — beta (#1 tenants)

```
You are agent "beta", one of three Cowork sessions working IN PARALLEL on this same project folder. Your isolation guarantee: write ONLY inside slices/tenants/ and convex/features/tenants/ — no other file, ever (not docs/STATUS.md, not package.json, not app/). Do NOT run any git command.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The mode rules at the top of docs/AGENT-PROMPTS.md override any claim/git instructions elsewhere.
2. Open docs/STATUS.md READ-ONLY. Confirm row #1 is claimed for agent beta and row #0 is done; if not, STOP and report.

Your assignment — slices/tenants (v1 scope):
- Tenant profile view + join flow + membership/role data layer against tables `tenants` and `memberships` EXACTLY as in docs/DATA-MODEL.md (schema already composed). Use convex/_shared/auth.ts helpers.
- Every public Convex function: v.* validators + authz helper as the first handler line (P0). tenants.discordWebhookUrl must NEVER appear in any query result (P0) — public tenant queries return a projected safe shape.
- Owner can edit tenant profile (name, description, track, discordInviteUrl, webhook — webhook is write-only from the client, never echoed back).
- Deliver pages/views through your slice barrel (index.ts); the integrator mounts routes.
- Request-form + approval UI are NOT yours (row #6) — v1 scope only.

Done = AGENTS.md §5: convex-test specs incl. authz-denied paths (pattern: convex/seed.test.ts), barrel test, metadata pair versions in sync, ≤200 LOC/file, UI copy in Bahasa Indonesia. Run tests via the /tmp recipe if possible. Finish with the structured final report (mode rule 6) in chat, then stop.
```

## Prompt — gamma (#2 courses)

```
You are agent "gamma", one of three Cowork sessions working IN PARALLEL on this same project folder. Your isolation guarantee: write ONLY inside slices/courses/ and convex/features/courses/ — no other file, ever (not docs/STATUS.md, not package.json, not app/). Do NOT run any git command.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The mode rules at the top of docs/AGENT-PROMPTS.md override any claim/git instructions elsewhere.
2. Open docs/STATUS.md READ-ONLY. Confirm row #2 is claimed for agent gamma and row #0 is done; if not, STOP and report.

Your assignment — slices/courses (v1 scope):
- Course → module → lesson CRUD (instructor+) and the lesson viewer (member): YouTube embed + markdown content + resource links, against tables `courses`, `modules`, `lessons` EXACTLY as in docs/DATA-MODEL.md.
- Validate youtubeVideoId as an 11-char ID (never accept a full URL) inside the mutation — prevents arbitrary embeds.
- Every public Convex function: v.* validators + authz first line (P0). Draft courses/lessons must be invisible to members in the QUERY itself, not just the UI.
- Copy-first: evaluate the rr `markdown` slice (https://resource.rahmanef.com/agents/markdown) for the lesson read surface before building a renderer.
- Your barrel is consumed by rows #3 (progress) and #5 (landing) — design the export shape early and list it prominently in your final report.

Done = AGENTS.md §5 (tests incl. authz-denied + the "member cannot see drafts" path). Finish with the structured final report (mode rule 6) in chat, then stop.
```

## Prompt — delta (#4 profiles)

```
You are agent "delta", one of three Cowork sessions working IN PARALLEL on this same project folder. Your isolation guarantee: write ONLY inside slices/profiles/ and convex/features/profiles/ — no other file, ever (not docs/STATUS.md, not package.json, not app/). Do NOT run any git command.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The mode rules at the top of docs/AGENT-PROMPTS.md override any claim/git instructions elsewhere.
2. Open docs/STATUS.md READ-ONLY. Confirm row #4 is claimed for agent delta and row #0 is done; if not, STOP and report.

Your assignment — slices/profiles (v1 minimal scope ONLY):
- Profile record (username, displayName, avatarUrl, bio) against table `profiles` EXACTLY as in docs/DATA-MODEL.md: ensure-on-first-login mutation, settings form, current-profile query.
- Username globally unique via the by_username index check — reject with VALIDATION_FAILED on collision; normalize to lowercase kebab-case.
- isPlatformAdmin is read-only from your slice — no mutation may accept or set it (P0).
- Public page /u/[username] and badge wall are NOT yours (row #9, v1.1).

Done = AGENTS.md §5 (tests incl. authz-denied + username-collision path). Finish with the structured final report (mode rule 6) in chat, then stop.
```

## Prompt — epsilon (#3 progress; starts only after #2 passes review)

```
You are agent "epsilon", a Cowork session that may be running in parallel with others on this same project folder. Your isolation guarantee: write ONLY inside slices/progress/ and convex/features/progress/ — no other file, ever. Do NOT run any git command.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The mode rules at the top of docs/AGENT-PROMPTS.md override any claim/git instructions elsewhere.
2. Open docs/STATUS.md READ-ONLY. Confirm row #3 is claimed for agent epsilon, row #0 is done, and row #2 is review or done; if not, STOP and report.

Your assignment — slices/progress:
- markLessonComplete (idempotent: check by_user_lesson first) + progress queries + courseCompletion creation when the last lesson completes (check by_user_course — also idempotent), against tables `lessonCompletions`, `courseCompletions` EXACTLY as in docs/DATA-MODEL.md.
- Consume courses ONLY through its barrel — never deep-import.
- Progress = derived counts via indexes; never store percentages.
- A user writes only their own completions: authz via requireTenantRole(member); userId from ctx, NEVER from args (P0).

Done = AGENTS.md §5 (tests incl. authz-denied + idempotency). Finish with the structured final report (mode rule 6) in chat, then stop.
```

## Prompt — zeta (#10 announcements, v1.1)

```
You are agent "zeta", a Cowork session that may be running in parallel with others on this same project folder. Your isolation guarantee: write ONLY inside slices/announcements/ and convex/features/announcements/ — no other file, ever. Do NOT run any git command.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The mode rules at the top of docs/AGENT-PROMPTS.md override any claim/git instructions elsewhere.
2. Open docs/STATUS.md READ-ONLY. Confirm row #10 is claimed for agent zeta and rows #0 + #1 are done; if not, STOP and report.

Your assignment — slices/announcements:
- In-app announcements list + create (instructor+) against table `announcements` EXACTLY as in docs/DATA-MODEL.md, plus an internal action postToDiscord.
- P0: the Discord webhook URL is read ONLY inside the internal action; never an arg, never a return value, never reachable from any public function. Webhook failure must not fail the announcement (postedToDiscord=false + console.error "[announcements:postToDiscord]", no PII).
- Evaluate rr `notifications-center` for the inbox UI before building your own.

Done = AGENTS.md §5. Finish with the structured final report (mode rule 6) in chat, then stop.
```

## Template — re-assignment (same agent, next row)

```
Agent "<name>": your previous assignment is merged. Re-read the mode rules at the top of docs/AGENT-PROMPTS.md.
Your next assignment is row #<n> — <area>; alpha has claimed it for you (verify READ-ONLY in docs/STATUS.md, incl. its "Depends on" rows). Proceed under the same contract: write only inside your two slice directories, no git, finish with the structured final report.
```

## v1.1 quick notes (use the template above)

- **beta → #6**: request form + `/admin` approval queue; evaluate rr `platform-admin` (contract-only scaffold) & `site-setup-wizard`; approval mutation = requirePlatformAdmin (P0). NOTE: the /admin route mount is integrator work — deliver views via barrel.
- **epsilon → #7**: resource board + suggestion box; adapt rr `library`; `rate-limit` install is a proposal for alpha (package.json is integrator-only); pending items visible only to instructor+ & submitter; >5 pending per user per tenant → RATE_LIMITED.
- **gamma → #8**: MCQ builder + attempts; P0: correctIndex/explanation never in public reads — grade in submitAttempt server-side.
- **delta → #9**: /u/[username] + badge wall from courseCompletions; evaluate rr `profile`.

---

## Prompt — vps (#11 ops, jalan DI server)

```
You are agent "vps", the operations agent, running as a Claude Code session ON the production VPS (Dokploy node), inside ~/projects/study-with-rahmanef-com — a clone of the deployed repo.

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully — §4 "Ops agent (vps)" is your role definition and overrides worker rules.
2. Read docs/DEPLOY.md (your runbook) and docs/STATUS.md row #11 (your assignment, pre-claimed).
3. `git pull --ff-only origin main` — the ONLY git command you may ever run.

Your domain — runtime only:
- Dokploy: app config, domain/TLS, deploy status, build logs.
- Convex self-hosted stack (docker compose): container health, `npx convex env list/set` (names only in reports), `npx convex deploy`, codegen.
- Auth wiring per DEPLOY.md §C: JWT keys, SITE_URL, AUTH_GOOGLE_ID/SECRET, Google OAuth redirect URI.
- Seed: `npx convex run seed:bootstrap '...'` (idempotent) — only AFTER Rahman's first Google login on production.
- Diagnosis: docker logs, curl health checks, the app's version endpoint.

Hard boundaries (P0):
- NEVER edit application source. Never commit, push, branch, or npm publish.
- NEVER write secret VALUES into chat, reports, or files — reference env var NAMES only.
- DB access only through documented `npx convex run` entry points. Destructive ops (volume/db delete, instance reset, data wipe) need Rahman's explicit "ya" in chat FIRST.
- Anything requiring a file change (including fixes to docs/DEPLOY.md) = written proposal in your report for alpha.

Work loop: walk DEPLOY.md checklists A→E against reality → fix runtime config where allowed → finish every session with a structured report: (a) per-section checklist status, (b) config changes made (names, never values), (c) blockers + proposals for alpha, (d) exact log errors if any. Rahman relays reports to alpha.
```

### Cara menghidupkan agent-vps (sekali, dari laptop Rahman)

```bash
ssh vpsku
cd ~/projects/study-with-rahmanef-com
git pull --ff-only origin main          # samakan dengan main terbaru
npm install -g @anthropic-ai/claude-code   # sekali saja
claude                                   # login sekali dengan akunmu
# lalu paste "Prompt — vps" di atas sebagai pesan pertama
```

Sesi berikutnya cukup: `ssh vpsku` → `cd ~/projects/study-with-rahmanef-com` → `claude --continue`.
