# AGENTS.md — Agent Contract · belajar-with-rahmanef.com

Binding contract for EVERY AI agent working in this repo. Read this file fully before touching code. Written in English for agent interop; UI copy you produce is Bahasa Indonesia (see §7).

## 0. What this project is

Charity AI-learning platform & community (Bahasa Indonesia). Multi-tenant LMS-lite: communities (tenants) → courses → modules → lessons (YouTube embed + markdown + links), self-paced progress tracking, MCQ quizzes, curated resource sharing, Discord-first discussion. Zero running cost beyond VPS + domain — this constraint is product law, not preference.

## 1. Binding documents — read order & precedence

| Order | Document | Authority |
|---|---|---|
| 1 | `AGENTS.md` (this file) | project contract — wins on project-specific matters |
| 2 | `docs/rr-conventions.md` | rr conventions v2 with P0/P1/P2 tiers — **its P0 rules always win over everything** |
| 3 | `DECISIONS.md` | product decision log (20 Q&A, resolved) |
| 4 | `docs/PRD.md` | requirements R1–R13, non-goals, release plan |
| 5 | `docs/DATA-MODEL.md` | Convex schema SSOT + access rules + security notes |
| 6 | `docs/SLICES.md` | slice plan, routes, build order, definition of done |
| 7 | `docs/STATUS.md` | live claim board — check & update every session |

If documents disagree: P0 > this file > lower-numbered docs. On drift you cannot resolve: log it in `docs/STATUS.md` → *Blocked / drift log* and stop that thread.

## 2. Stack lock (P1)

Next.js ^16 · React ^19 · Tailwind v4 (`@tailwindcss/postcss`) · Convex self-hosted ≥1.16 · `@convex-dev/auth` (NO Clerk) · TypeScript strict · `proxy.ts` (never `middleware.ts`). Do not add or upgrade any dependency without (a) checking the rr catalog first and (b) logging a proposal in `docs/STATUS.md`.

## 3. Copy-first (P1) — the rr catalog

Catalog: **https://resource.rahmanef.com** — machine-readable: [`/api/knowledge`](https://resource.rahmanef.com/api/knowledge) (JSON: every layout + slice + rule) and [`/llms.txt`](https://resource.rahmanef.com/llms.txt). Per-slice one-shot agent prompt: `/agents/<slug>`. Install: `npx rahman-resources add <slug>` (alias `npx rr add <slug>`). Never greenfield what the catalog already solves; lift = sanitize first (strip consumer URLs/roles/copy → props).

Pre-mapped for this project (verified against the catalog 2026-07-05):

| Need (req.) | rr slice | Action |
|---|---|---|
| Google sign-in (R1) | `convex-auth` | install, google provider only |
| Workspace shell | `dashboard-shell` | install |
| Landing header/footer (R2) | `marketing-chrome` | install |
| Landing sections (R2) | `sections` | install/adapt |
| Theme switcher | `theme-presets` | install |
| Dialogs (mandatory primitive) | `responsive-dialog` | install |
| Skeletons/empty/error states | `feedback-states` | install |
| Lesson markdown rendering (R4) | `markdown` | evaluate/adapt (read surface only) |
| Resource board (R8) | `library` | adapt — closest existing shape |
| Anti-spam counters (R8/R9) | `rate-limit` | install |
| Platform admin `/admin` (R7) | `platform-admin`, `admin` | evaluate — note: platform-admin is a contract-only scaffold |
| Member/role management (R13) | `user-management`, `rbac-roles` | evaluate — our per-tenant roles are 3 literals; do NOT import the full RBAC engine unless it maps cleanly |
| Announcements inbox UI (R12) | `notifications-center` | evaluate |
| Admin tables | `data-table` | install where needed |
| Public profile (R11) | `profile` | evaluate/adapt |
| Tenant onboarding (v1.1) | `site-setup-wizard` | evaluate |
| Per-lesson comments (fase 2) | `comments` | later — do not install in v1 |
| Metrics instrumentation (fase 2) | `event-tracking` | later |

Quality gate: `audit-bp` score ≥80 to ship (pulls latest Next 16 / React 19 / Convex docs before scoring).

## 4. Multi-agent protocol (P1)

- **Agent naming.** The integrator session is **`alpha`**. Workers take fixed Greek names (`beta`, `gamma`, `delta`, `epsilon`, `zeta`, …) and the ops agent is **`vps`** — assignments listed in `docs/AGENT-PROMPTS.md`. Use your name in every STATUS.md claim and in every commit body as `Agent: <name>`.
- **Unit of assignment = ONE vertical slice** (or one named app-level area). You own only your assignment.
- **Claim before work.** Default: open `docs/STATUS.md` and set your row yourself. In *Cowork parallel* mode (current — see docs/AGENT-PROMPTS.md) the integrator claims and updates rows on workers' behalf; workers treat STATUS.md as READ-ONLY and report via chat instead.
- **Never edit outside your assignment.** Cross-slice needs resolve ONLY through the other slice's barrel. If the barrel lacks what you need: write the request in `docs/STATUS.md` → *Proposals*, add `// TODO(rr): waiting on <slice> barrel export <name>`, and continue with a mock/adapter. Never deep-import, never edit someone else's slice.
- **Shared surfaces are integrator-only:** `convex/schema.ts`, `convex/_shared/**`, `app/` shells & layouts, `proxy.ts`, `package.json`, `next.config.mjs`, theme/tones. Agents propose (STATUS *Proposals* + TODO marker at the call site); only the **integrator** (Rahman's main session) applies.
  - Exception: the schema is fully pre-designed in `docs/DATA-MODEL.md`. Implementing exactly what is written there is pre-approved. Any deviation requires a DATA-MODEL.md change via the integrator FIRST.
- **Git & commits.** The current execution mode is declared at the top of `docs/AGENT-PROMPTS.md` and overrides this bullet's mechanics. (a) *Parallel worktrees*: workers commit on `slice/<slug>` branches; integrator merges. (b) *Cowork parallel, same folder (CURRENT)*: workers run simultaneously but write ONLY inside their own slice directories — zero shared-file writes (no STATUS.md edits, no git; sandbox git on the mounted folder is unreliable). The integrator keeps the board, verifies, commits with `Agent: <name>` credit in the body, and hands the push to Rahman. Either mode: conventional commits; AI commits end with `Co-Authored-By: Claude <noreply@anthropic.com>`; never push unless you are the integrator session.
- **Ops agent (`vps`).** Runs as a Claude Code session ON the production VPS (Dokploy node) inside the deployed repo clone. Owns runtime only: Dokploy app config, the Convex self-hosted stack, Convex env vars, `npx convex deploy`, documented seed runs, log diagnosis. NEVER edits application source; the only permitted git command is `git pull --ff-only origin main`. Secrets stay on the server — reports reference env var NAMES, never values (P0). DB access only through documented `npx convex run` entry points; destructive ops (volume/db deletion, instance reset) require Rahman's explicit confirmation first. File-change needs (incl. docs/DEPLOY.md) are proposals to alpha. NARROW EXCEPTION (added 2026-07-06, widened same day after hotfix 86ca386): when a fix is deploy-blocking AND mechanical — runtime wiring (`convex/auth.config.ts`, `.env.example`, `convex/_generated` regen) or toolchain-required renames with import updates (e.g., Convex module-path rules) — vps MAY commit it as `fix(ops|convex|auth): …`, flagged for MANDATORY alpha post-review. Behavioral logic changes are never covered. Application logic remains off-limits.
- **Never deploy, never `npm publish`** (P0). Dokploy deploys from main; staging flow (`git push origin main:staging` → `e2e:staging` → main) is integrator-only.

## 5. Definition of done — per assignment

1. `npx tsc --noEmit` green.
2. `convex-test` for every mutation/query **including the authz-denied path** (unauthenticated + wrong-role callers rejected) — P0.
3. Barrel API test (the contract consumers rely on).
4. Slice metadata pair present, versions in sync (`audit:slices`); no file >200 LOC (`audit:file-size`).
5. No cross-slice imports except barrels; no hardcoded URLs/copy (props-driven).
6. `audit-bp` ≥80 where the tooling exists.
7. `docs/STATUS.md` row updated to `review` (or `done` after integrator merge) with the branch + last commit hash.

## 6. Security P0s (absolute — stop and report if your task conflicts)

- `v.*` validators on **every** public Convex function; authz helper (`requireUser` / `requireTenantRole` / `requirePlatformAdmin` from `convex/_shared/auth.ts`) is the **first line** of every handler. Route/layout guards are UX, not security.
- **Anonymous public-read exception (etalase).** A QUERY may skip the authz helper ONLY if ALL of these hold: (1) its name starts with `public` OR it is declared in an `ANONYMOUS ETALASE WHITELIST` comment at the top of the slice's queries file (auditable either way); (2) it reads exclusively `active`/`published` rows through an index; (3) it returns an explicit safe projection — never raw docs, never `discordWebhookUrl`, drafts, member lists, quiz answers, or user data beyond public-profile fields. Serves PRD R2/R3 (landing & etalase). Mutations and internal lookups NEVER qualify — a protected by-ID read authenticates BEFORE touching the DB.
- Secrets never reach the client: no sensitive `NEXT_PUBLIC_*`; `tenants.discordWebhookUrl` never appears in any query result (Discord posting via internal action only); `quizzes.questions[].correctIndex`/`explanation` stripped from all public reads — grading is server-side.
- Every `'use server'` export authenticates AND authorizes.
- No bare `.collect()` — `.withIndex(...)` + `.take(n)`/pagination (bounded-table exception needs a `// TODO(rr): bounded table` marker).
- Errors: `ConvexError({ code, message })` with codes from the slice's `types.ts` (`NOT_AUTHENTICATED | NOT_AUTHORIZED | NOT_FOUND | VALIDATION_FAILED | RATE_LIMITED`). No internals or PII in messages or logs.

## 7. Product guardrails

- **Language:** UI copy & content = Bahasa Indonesia (technical terms stay English). Code, comments, commit messages, docs-in-code = English.
- **Zero-cost:** no paid services. Video = YouTube embed only. Notifications = in-app + Discord webhook. No email service in v1.
- **Do NOT build, even if it seems helpful** (PRD non-goals): in-app chat/forum, payments, email sending, PDF certificates, native mobile app, file upload, self-hosted video.
- **UI:** shadcn primitives only; theme tokens only (no hex); mobile-first; exactly one shell chrome; workspace surfaces full-bleed `h-dvh` without marketing chrome.
- **Convex module naming (discovered 2026-07-06, hotfix 86ca386):** non-test module files under `convex/**` must be camelCase — Convex forbids `-` in module paths and the whole deploy fails (`*.test.ts` exempt: Convex excludes them). Slice frontend files stay kebab-case per rr P2. Until a CI guard exists, this rule is prompt-enforced (treat as P1).
- **Tenancy:** every domain table carries `tenantId` and every query scopes by it (index `by_tenant*`). Tenant routing is path-based `/t/[slug]`.

## 8. When blocked

- Decision you cannot ask about → take the option these docs recommend, mark `// TODO(rr): confirm — chose X over Y because <reason>`, list it in the commit body and STATUS notes.
- P0 conflict → stop, report in `docs/STATUS.md` *Blocked / drift log*. Do not route around P0.
- Copy-first source missing (CLI fails, slice absent, source path not on this machine) → STOP and ask; do not reconstruct from memory.

## 9. Quick facts

- Live host: **https://study-with.rahmanef.com** (repo: study-with-rahmanef-com; project codename tetap belajar-with-rahmanef.com — brand decision pending, Rahman). Tenant routes `/t/[slug]` · admin `/admin` · profiles `/u/[username]`.
- Hosting: Dokploy VPS; Convex self-hosted via Docker Compose on the same node.
- Releases: v1 = R1–R6 (build steps 0–4 in SLICES.md), v1.1 = R7–R13 (steps 5–9).
- First tenant is seeded (Rahman's community); the "open a community" request form ships in v1.1.
