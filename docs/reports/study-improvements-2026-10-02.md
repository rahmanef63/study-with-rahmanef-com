# Study with Rahmanef — improvement candidate, 2026-10-02

Status: verified source candidate; production release and placement backfill have not been performed. Integrator alpha with beta (learner UI/browser), gamma (progress/quiz), delta (independent review) and initial read-only runtime auditors. Maximum four agents ran concurrently. No paid service or new dependency was introduced.

## Scope and ownership

Canonical source: `/home/rahman/projects/study-with-rahmanef-com`, branch `auto/study-security-deps-20260910`, baseline `7a49f66`. Work is isolated in `/home/rahman/worktrees/study-improvements-20261002`, branch `feat/study-improvements-20261002`. Its baseline includes two September security/CI commits absent from main (`49819b5`, `7a49f66`), so the PR includes those fixes.

Observed production frontend: public `https://study-with.rahmanef.com`, Dokploy application `nnD3Po5rSIYXBGhkZtsu_`, Swarm service `study-with-rahmanef-com-inpwce`; authoritative deployed checkout `/etc/dokploy/applications/study-with-rahmanef-com-inpwce/code` at `34561a9`, Next 16.2.10. Last deployment `g6q4T1Sq8cBIad6YJSurE`. Backend is Convex Cloud production `rare-toucan-552`; dev selection is `coordinated-finch-69`. Frontend and backend publish separately. Production source drift remains until an approved release.

Previous frontend image for rollback: `sha256:80cbc9a6d3401ca33328cf6998b042a670d705a4026e8fde4f0a5cb7b92e3e4a`. Preserve/tag this image before releasing. Swarm uses one replica, start-first update and rollback-on-failure; the observed running image had no healthcheck. Dockerfile now declares one, but it will only become active after rebuilding/releasing. GitHub source configuration has auto-deploy enabled but no githubId; repository hooks API returned no hooks. App-installation delivery has not been proven. Main push alone is not release evidence.

## Implemented changes

- Shared membership/role authorization now rejects pending or suspended tenants. Platform-admin approval can restore access. Completion, content and member data remain intact.
- Progress reads exact per-lesson completion indexes beyond the old 500-history scan, counts only published same-tenant material and avoids fetching lesson bodies when placement snapshots exist. Optional `courseLessons.lessonPublished` is maintained transactionally by publication and placement producers. Legacy reads are bounded to ten lesson documents; incomplete results explicitly report truncation and cannot create a badge. Overview examines at most ten exact courses per transaction; larger results advertise truncation. A 201-row legacy roster is detected and cannot mint a false badge. Deleting a lesson with 51 legacy placements fails atomically so no dangling published snapshot survives.
- A material can be newly placed in at most 50 courses and a course holds at most 200 materials. Completion settles three courses synchronously and at most 47 further jobs; each job checks current active tenancy, membership, publication, placement and completion. Repeat submissions remain idempotent. Operator-only backfill processes ten placements per page, supports dry-run and independent verification, and never runs implicitly.
- Learners get start/resume/review actions, a return path after the last lesson and quiz, accurate unknown-progress states, accessible syllabus/progress labels, quiz state reset across routes, submission locking and visible attempt exhaustion. Existing routes, theme, authentication and community content are preserved.
- Each community task surface owns its visible h1. The shell has a keyboard skip link and reduced-motion support. Landing stats stream separately from the hero; the existing hero asset uses Next Image. Roadmap internal navigation uses Next Link and the next-material label describes its actual meaning.
- Next/eslint-config-next 16.3.8, Vitest 4.1.11 and compatible transitive patches remove all reported advisories. No exploit or compromise was established; the Next OG advisory concerns attacker-controlled SVG, while this repository uses static OG content.
- Persisted deployment ID powers health/version and rolling version checks even when Next reuses BUILD_ID. `next start` also reads the built ID rather than generating a new one. Runtime logs contain framework error categories only. Global response headers add nosniff, referrer policy and frame/object/base restrictions without restricting embedded YouTube or application scripts.
- CI checks project contracts, dependency advisories, lint, TypeScript, unit tests, production build and standalone health identity. Docker health tests frontend readiness only; Convex outage must not cause a restart loop.

## Verification

Node 22.23.2. `npm ci` used the committed lockfile; Convex codegen regenerated only two module bindings through the selected dev deployment. CLI source confirms codegen does not finish/publish the function push. No backend deployment, seed or backfill was run.

| Check | Evidence |
|---|---|
| Full unit/authorization suite | 1,131 tests / 128 files passed in 96.07s; `/tmp/study-full-tests-20261002.log` |
| Final backend edge regressions | After the full suite, 32 tests / four files passed, including red→green legacy 201-roster and 51-placement deletion cases; `/tmp/study-final-edge-regressions-20261002.log` |
| Release identity regression | Three tests passed, including persisted config ID despite runtime env drift; `/tmp/study-final-release-regression-20261002.log` |
| TypeScript | Full `tsc --noEmit` passed again after final backend and release regression changes; Next build typecheck passed |
| ESLint | Zero errors; 59 existing warnings. Edited config and browser spec targeted lint passed |
| Stack/slice/source contracts | 17 slice metadata pairs and 734 source files checked; zero violations; `/tmp/study-contract-audit-final-20261002.log` |
| Dependency audit | Zero vulnerabilities at all severities; `/tmp/study-final-audit-20261002.json`; independently repeated by delta |
| Production build | Next 16.3.8 compiled in 99s, typechecked and emitted routes; `/tmp/study-build-20261002.log` |
| Standalone runtime | Health/version HTTP 200, matching ID and revision `study-candidate-20261002`, no-store, required security headers; restarted server preserved health/identity; `/tmp/study-runtime-20261002.json` |
| Alternate startup regression | Actual no-env `next start` returned the persisted build ID with null revision; production uses standalone as recommended by Next |
| Anonymous browser | 23/23 tests passed in 29.8s, workers 2, localhost:3107; `/tmp/study-browser-qa-20261002.log` |
| Visual/accessibility | 1440×900 and 375×812 landing/community/course screenshots inspected; one visible h1, loaded assets, no horizontal overflow, keyboard skip transfers main focus, reduced-motion durations ≤0.001s |

Browser HTML report: `e2e/playwright-report/index.html`. Screenshots: `e2e/test-results/accessibility.anon-desktop-ad8fa-assets-and-contained-layout-chromium/` and `e2e/test-results/accessibility.anon-mobile--95c59-assets-and-contained-layout-chromium/`. These generated artifacts are gitignored. Baseline live screenshots remain in `/home/rahman/.t3/userdata/browser-artifacts/`. T3 preview explicitly reported no automation host, so installed Playwright was used as the authorized fallback.

## Limits and release procedure

No recorded auth state was available: member/owner/quiz browser interactions and OAuth/session restart have not been verified against a live candidate backend. Their business/auth logic is covered by unit and Convex tests. Anonymous candidate browser reads used the existing production public backend; they do not prove the changed backend is deployed. No claim is made that source verification changed the live site.

Follow [DEPLOY](../DEPLOY.md) for separate backend/frontend deployment and the full cursor dry-run → write → verify cycle. Backfill must finish and an independent scan must return zero mismatches before declaring large legacy-course progress fully migrated. After backfill, retain the optional schema field when rolling backend functions back. Do not revert to a schema that rejects populated snapshots.

Pass the final release SHA as APP_REVISION at Docker build and runtime; the local acceptance identifier above is a candidate label, not a release SHA. Verify actual deployed version, health, static assets, anonymous/member flows, restart behavior and backend parity after release. Do not seed, purge or reset data to resolve deployment issues.

AGENTS §4 says “Never deploy, never npm publish” (P0). This candidate therefore stops before main merge, production deployment and data migration until Rahman authorizes those concrete release actions.

Official references consulted: [Next deploymentId](https://nextjs.org/docs/app/api-reference/config/next-config-js/deploymentId), [Next configuration phases](https://nextjs.org/docs/pages/api-reference/config/next-config-js), [Convex best practices](https://docs.convex.dev/understanding/best-practices), [Convex transaction limits](https://docs.convex.dev/production/state/limits). Independent audit findings and score are recorded in [study-audit-2026-10-02](study-audit-2026-10-02.md).
