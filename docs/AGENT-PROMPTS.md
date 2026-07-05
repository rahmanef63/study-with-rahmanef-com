# Agent Prompts — Execution Mode & Ready-to-Paste Prompts

> Contract: [AGENTS.md](../AGENTS.md). Claim board: [STATUS.md](STATUS.md).

## CURRENT EXECUTION MODE: Cowork local-first (sequential)

All workers run as **Claude Cowork sessions on the same project folder** (no worktrees, no clones). Rules that override anything else:

1. **One worker session at a time.** Same folder = parallel sessions overwrite each other. Order: beta → gamma → delta (then wave 1.5/2 per STATUS "Depends on").
2. **Workers never run git.** No commit, no branch, no push — Cowork sandbox git on the mounted folder is unreliable, and the integrator needs clean review anyway. Claiming = editing `docs/STATUS.md` directly.
3. **alpha (integrator) commits for you** after review, crediting `Agent: <name>` in the commit body, then Rahman pushes.
4. Tests are still mandatory to WRITE (DoD §5). To RUN them inside Cowork: copy the folder to sandbox `/tmp/w` (exclude node_modules), `npm install --legacy-peer-deps` there (re-run if it times out — progress persists), then `npx vitest run` and `npx tsc --noEmit`. If the install won't complete, ship the tests anyway and write "tests not executed" in your STATUS notes — alpha executes them at review.
5. Reference test pattern: `convex/seed.test.ts` (modules glob + convex-test + denied-path).

*(The old parallel-worktree mode is shelved until Rahman wants it back; prompts below are mode-agnostic except the git rules above.)*

## Names & assignments

| Name | Role | Assignments |
|---|---|---|
| **alpha** | INTEGRATOR — Rahman's main session; owns shared surfaces, review, commits, merges | #0 ✅, #5 landing, all reviews |
| **beta** | worker | #1 tenants → #6 request+approval (v1.1) |
| **gamma** | worker | #2 courses → #8 quiz (v1.1) |
| **delta** | worker | #4 profiles → #9 public profile+badges (v1.1) |
| **epsilon** | worker | #3 progress (after #2 review) → #7 resources (v1.1) |
| **zeta** | worker (optional) | #10 announcements (v1.1) |

---

## Prompt — beta (#1 tenants)

```
You are agent "beta" working in the belajar-with-rahmanef.com project folder (Cowork local-first mode — you are the only active worker; do NOT run any git command).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The execution-mode rules at the top of docs/AGENT-PROMPTS.md override any git/branch instructions elsewhere.
2. Open docs/STATUS.md. Your assignment is row #1 — slices/tenants (tenant profile, join, memberships, roles). Verify row #0 is `done`; if not, STOP and report.
3. Claim: edit your row — status `in-progress`, agent `beta`. Editing the file IS the claim.

Hard boundaries:
- Work ONLY inside slices/tenants/ and convex/features/tenants/. App routes, convex/schema.ts, convex/_shared/**, package.json, proxy.ts are integrator-only — write requests in docs/STATUS.md → Proposals instead of editing.
- The schema is already composed — implement against tables `tenants` and `memberships` exactly as in docs/DATA-MODEL.md. Use the helpers in convex/_shared/auth.ts.
- Every public Convex function: v.* validators + authz helper as the first handler line (P0). tenants.discordWebhookUrl must NEVER appear in any query result (P0) — public tenant queries return a projected safe shape.
- Deliver pages/views through your slice barrel (index.ts); the integrator mounts routes.
- Request-form + approval UI are NOT yours (row #6) — v1 scope only.

Done = AGENTS.md §5: tests written (convex-test incl. authz-denied, pattern: convex/seed.test.ts), barrel test, metadata pair versions in sync, ≤200 LOC/file, UI copy in Bahasa Indonesia. Run tests via the /tmp recipe in docs/AGENT-PROMPTS.md if possible. Then set your STATUS row to `review` with notes listing key files + barrel exports, and stop.
```

## Prompt — gamma (#2 courses)

```
You are agent "gamma" working in the belajar-with-rahmanef.com project folder (Cowork local-first mode — you are the only active worker; do NOT run any git command).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The execution-mode rules at the top of docs/AGENT-PROMPTS.md override any git/branch instructions elsewhere.
2. Open docs/STATUS.md. Your assignment is row #2 — slices/courses (course/module/lesson CRUD + lesson viewer: YouTube embed + markdown + links). Verify row #0 is `done`; if not, STOP and report.
3. Claim: edit your row — status `in-progress`, agent `gamma`.

Hard boundaries:
- Work ONLY inside slices/courses/ and convex/features/courses/. Shared surfaces are integrator-only — propose via docs/STATUS.md.
- Implement against tables `courses`, `modules`, `lessons` exactly as in docs/DATA-MODEL.md. Validate youtubeVideoId as an 11-char ID (never accept a full URL) in the mutation (P0-adjacent: prevents arbitrary embeds).
- Every public Convex function: v.* validators + authz first line (P0). Draft courses/lessons must be invisible to members in the QUERY itself, not just the UI.
- Copy-first: evaluate the rr `markdown` slice (https://resource.rahmanef.com/agents/markdown) for the lesson read surface before building a renderer.
- Export a stable barrel early — rows #3 (progress) and #5 (landing) consume it; publish the export shape in your STATUS notes as soon as it settles.

Done = AGENTS.md §5 (tests incl. authz-denied + the "member cannot see drafts" path). Set STATUS row to `review` + notes, stop.
```

## Prompt — delta (#4 profiles)

```
You are agent "delta" working in the belajar-with-rahmanef.com project folder (Cowork local-first mode — you are the only active worker; do NOT run any git command).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The execution-mode rules at the top of docs/AGENT-PROMPTS.md override any git/branch instructions elsewhere.
2. Open docs/STATUS.md. Your assignment is row #4 — slices/profiles, v1 minimal scope ONLY: profile record (username, displayName, avatar), auto-create on first login, settings form. Verify row #0 is `done`; if not, STOP and report.
3. Claim: edit your row — status `in-progress`, agent `delta`.

Hard boundaries:
- Work ONLY inside slices/profiles/ and convex/features/profiles/. Shared surfaces are integrator-only.
- Table `profiles` exactly as in docs/DATA-MODEL.md; username unique via the by_username index check (reject with VALIDATION_FAILED on collision; normalize to lowercase kebab).
- Public page /u/[username] and badge wall are NOT yours (row #9, v1.1).
- isPlatformAdmin is read-only from your slice — no mutation may accept or set it (P0).

Done = AGENTS.md §5 (tests incl. authz-denied + username-collision path). Set STATUS row to `review` + notes, stop.
```

## Prompt — epsilon (#3 progress; start only after #2 is `review` or `done`)

```
You are agent "epsilon" working in the belajar-with-rahmanef.com project folder (Cowork local-first mode — you are the only active worker; do NOT run any git command).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The execution-mode rules at the top of docs/AGENT-PROMPTS.md override any git/branch instructions elsewhere.
2. Open docs/STATUS.md. Your assignment is row #3 — slices/progress (mark-complete, progress bars, course completion). Verify row #0 is `done` AND row #2 is at least `review`; if not, STOP and report.
3. Claim: edit your row — status `in-progress`, agent `epsilon`.

Hard boundaries:
- Work ONLY inside slices/progress/ and convex/features/progress/. Consume courses ONLY through its barrel — never deep-import.
- Tables `lessonCompletions`, `courseCompletions` exactly as in docs/DATA-MODEL.md. markLessonComplete is idempotent (check by_user_lesson first); it creates the courseCompletion when the last lesson completes (check by_user_course — also idempotent).
- Progress = derived counts via indexes; never store percentages.
- A user may only write their own completions: authz via requireTenantRole(member); userId comes from ctx, NEVER from args (P0).

Done = AGENTS.md §5 (tests incl. authz-denied + idempotency). Set STATUS row to `review` + notes, stop.
```

## Prompt — zeta (#10 announcements, v1.1)

```
You are agent "zeta" working in the belajar-with-rahmanef.com project folder (Cowork local-first mode — you are the only active worker; do NOT run any git command).

Onboarding, in order:
1. Read CLAUDE.md, then AGENTS.md fully, then follow its §1 read order. The execution-mode rules at the top of docs/AGENT-PROMPTS.md override any git/branch instructions elsewhere.
2. Open docs/STATUS.md. Your assignment is row #10 — slices/announcements (in-app list + Discord webhook). Verify rows #0 and #1 are `done`; if not, STOP and report.
3. Claim: edit your row — status `in-progress`, agent `zeta`.

Hard boundaries:
- Work ONLY inside slices/announcements/ and convex/features/announcements/.
- Table `announcements` exactly as in docs/DATA-MODEL.md. Create = instructor+ (requireTenantRole).
- P0: the Discord webhook URL is read ONLY inside an internal action (postToDiscord); it must never be an arg, a return value, or reachable from any public function. Webhook failure must not fail the announcement (postedToDiscord=false + console.error with [announcements:postToDiscord] prefix, no PII).
- Evaluate rr `notifications-center` for the inbox UI before building your own.

Done = AGENTS.md §5. Set STATUS row to `review` + notes, stop.
```

## Template — re-assignment (same agent, next row)

```
Agent "<name>": your previous assignment is merged. Re-read docs/STATUS.md and the mode rules at the top of docs/AGENT-PROMPTS.md.
Your next assignment is row #<n> — <area>. Verify its "Depends on" rows are `done`, claim it (edit STATUS.md), and proceed under the same contract. Scope and P0 notes are in STATUS.md and docs/PRD.md.
```

## v1.1 quick notes (use the template above)

- **beta → #6**: request form + `/admin` approval queue; evaluate rr `platform-admin` (contract-only scaffold) & `site-setup-wizard`; approval mutation = requirePlatformAdmin (P0).
- **epsilon → #7**: resource board + suggestion box; adapt rr `library`; propose `rate-limit` install via STATUS → Proposals (package.json is integrator-only); pending items visible only to instructor+ & submitter; >5 pending per user per tenant → RATE_LIMITED.
- **gamma → #8**: MCQ builder + attempts; P0: correctIndex/explanation never in public reads — grade in submitAttempt server-side.
- **delta → #9**: /u/[username] + badge wall from courseCompletions; evaluate rr `profile`.
