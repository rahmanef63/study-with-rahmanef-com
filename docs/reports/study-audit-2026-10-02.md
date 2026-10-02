# Independent source audit — Study with Rahmanef, 2026-10-02

Reviewer: delta. **Score: 100/100; APPROVE for the reviewed source candidate.** The same five-finding baseline scored 64/100. This is a bounded review of the improvement branch and its release safeguards, not a claim that the deployed application or every historical implementation is perfect.

Scope: `--changed` (pending changes plus the previous 15 commits), branch `feat/study-improvements-20261002`, baseline `7a49f66`, worktree `/home/rahman/worktrees/study-improvements-20261002`. Canonical checkout and production were not edited by this reviewer. The detailed integration/runtime record is [study-improvements-2026-10-02.md](study-improvements-2026-10-02.md).

Stack: Next 16.3.8 App Router, React 19, TypeScript strict, Convex Cloud, single-replica standalone frontend. Context7: **FALLBACK**; current official Next, React and Convex documentation was fetched directly. Self-hosted Convex checks do not apply. Existing anonymous server rendering and disabled Cache Components follow the project's explicit contract.

## Evidence and scoring

| Gate | Verified evidence |
|---|---|
| Dependency security | Independent fresh `npm audit --json`: zero vulnerabilities at every severity; `/tmp/study-review-npm-audit-final-20261002.json`. Next/eslint-config-next 16.3.8, Vitest 4.1.11, brace-expansion 1.1.21/5.0.12 and DOMPurify 3.4.16 are installed. |
| Mechanical KPI | 169 source files scanned; no validator, Server Action authorization, unbounded mutation collect, email identity bypass, legacy middleware, typed-any catch, deployment-ID or encryption-key findings. Two signals were manually accepted below. |
| Project contracts | Stack pin, 17 slice metadata pairs and source size checks pass. Independent `npm run audit` and `npm run typecheck` pass. |
| Business and access tests | Integrated suite: 1,131 tests / 128 files passed. Independent targeted passes: 84 tests / 15 files before the budget changes, then 34 tests / 6 files covering their final implementation and runtime identity. |
| Final integrity corrections | After reproducing the 201-placement false-completion and 51-placement incomplete deletion, the final four affected test files passed 32 tests; final TypeScript and targeted lint passed. This focused run follows the broad integrated suite rather than claiming that the broad suite was repeated afterward. |
| Lint | Integrated lint passes with zero errors; 59 existing warnings remain. Warnings were not silently reported as absent. |
| Build | Next 16.3.8 production build compiled in 99s, completed TypeScript and emitted routes; `/tmp/study-build-20261002.log`. |
| Runtime identity and headers | Independent HTTP reads of candidate `/api/health` and `/api/version` return 200, `study-candidate-20261002`, `no-store`, `nosniff` and frame-ancestor protection. Integrator also verified restarted standalone runtime and an actual no-env `next start`. |
| Startup phase contract | Independent assertions confirm production-server phase uses the persisted deployment ID even when APP_REVISION differs, while build phase uses the new revision. The final three release/phase regression tests, TypeScript and lint also pass. The installed Next implementation confirms BUILD_ID becomes constant when deploymentId is configured; version polling now uses the actual deployment identity. |
| Browser and accessibility | Beta's recorded run: 23/23 anonymous tests pass at desktop 1440×900 and mobile 375×812. Visual inspection, loaded assets, horizontal containment, one visible h1, skip-link focus and reduced motion pass. Delta reviewed the evidence and did not run a competing browser. |

Scoring follows the skill: baseline 100, minus 25/blocker, 12/high, 6/medium and 2/low. No scored finding remains in this scope.

| Baseline finding | Previous deduction | Resolution |
|---|---:|---|
| SECURITY-DEPS001 | 12 | All five initially reported vulnerable packages are patched; the independent final audit reports zero. |
| NEXT-DEPLOY001 | 6 | Persisted deployment identity is used by version polling and both supported startup modes; runtime/build environment drift is tested. |
| OPS-HEALTH001 | 6 | Frontend readiness endpoint and Docker healthcheck are implemented; built runtime readiness and release identity are verified. Backend outages do not cause a restart loop. |
| NEXT-OBSERVABILITY001 | 6 | Next onRequestError records framework categories while excluding URLs, headers, error payloads and user data. |
| CI-GATES001 | 6 | CI now gates project contracts, dependency advisories, lint, types, unit tests, production build and standalone readiness. Source configuration and equivalent local checks are verified; a new hosted CI run is not claimed. |

## Correctness review

The shared role guard rejects inactive tenants after authenticating and checking membership; platform administrators retain the independent restoration path. Existing permission-denied tests and the new suspended/pending-tenant regression pass. Quiz reads remain answer-stripped; attempt ceilings are server-owned, rapid submissions share a synchronous lock, keyed sessions discard prior answers/results, and exhausted attempts cannot offer a misleading retry. These follow [Convex validation and indexed queries](https://docs.convex.dev/functions/query-functions) and [React state identity](https://react.dev/learn/preserving-and-resetting-state).

Progress snapshots are maintained by both production placement producers and the publication writer. New writers enforce 200 lessons/course and 50 courses/lesson. Derivation detects a 201st legacy placement, reports truncation and refuses completion; deletion detects a 51st placement and rejects before deleting any row. Legacy full-body reads share a ten-document cache. Overview examines at most ten courses, with at most approximately 2,000 completion index ranges. These bounds address the separate 16MiB read and 4,096 index-range limits, rather than treating a document-count limit as sufficient. [Convex transaction limits](https://docs.convex.dev/production/state/limits#transactions).

Completion fanout settles three courses immediately and at most 47 in isolated internal jobs. Deferred jobs re-check tenant, membership, lesson/course publication, placement and the caller's completion. Re-marking an existing completion can settle a subsequently added course; existing badges prevent redundant work. The operator-only eligibility backfill pages ten placements, supports dry-run/verification, preserves cursors and is idempotent. Internal visibility and current-state checks follow [Convex internal functions](https://docs.convex.dev/functions/internal-functions).

Deployment identity, optional runtime error capture and frontend readiness are implemented without a paid service. The phase-aware ID fixes an initially detected mismatch between built assets and no-env next start. [Next self-hosting/version skew](https://nextjs.org/docs/app/guides/self-hosting#version-skew), [Next instrumentation](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation).

Mechanical exceptions: `components/shell/app-shell.tsx:46` is a native same-page `#main-content` accessibility link, not a route-navigation violation. `app/(shell)/roadmap/page.tsx:110` is a pre-existing decorative 56px image with dimensions and lazy decoding/loading. Both are disclosed; the raw KPI script exits 1 because it does not understand these cases. The generic frontend/slices feature-layout script targets a different repository shape; this project's authoritative metadata/structure scripts were used instead.

## Release boundaries and unverified areas

Production remains at observed frontend revision `34561a9`, Next 16.2.10. This audit does not assign production the candidate's score. Backend publication, frontend publication, live placement backfill and post-release parity remain separate release actions. No reviewer deployed, seeded, purged or reset production data.

No recorded authenticated browser session was available. Member/owner/quiz browser behavior, OAuth round trips and authenticated session restart were not verified against a deployed candidate backend; unit and Convex authorization tests cover their logic. Anonymous browser tests used the existing public backend and do not prove publication of the changed functions. First-load JavaScript size and a new hosted CI run were not measured. These are explicit limits, not hidden passes.

Before claiming release completion, follow [DEPLOY](../DEPLOY.md): publish backend/frontend separately, run the complete cursor dry-run → write → independent verify cycle until zero mismatches, verify the actual released SHA/health, and exercise authenticated flows. Keep the optional snapshot field when rolling functions back after backfill. Preserve the prior frontend image and user data.

```yaml
audit_bp:
  version: "2026-04-25"
  reviewer: delta
  date: "2026-10-02"
  scope: changed
  target: source-candidate
  branch: feat/study-improvements-20261002
  baseline: 7a49f66
  context7: FALLBACK
  stack:
    next: "16.3.8"
    react: "19"
    convex: cloud
    database: n/a
    frontend: standalone-single-replica
  score: 100
  baseline_score: 64
  verdict: APPROVE
  finding_counts:
    blocker: 0
    high: 0
    medium: 0
    low: 0
  findings: []
  resolved_findings:
    - SECURITY-DEPS001
    - NEXT-DEPLOY001
    - OPS-HEALTH001
    - NEXT-OBSERVABILITY001
    - CI-GATES001
  kpi:
    files_scanned: 169
    raw_anchor_count: 1
    raw_img_count: 1
    unbounded_collect_count: 0
    identity_email_bypass_count: 0
    typed_catch_any_count: 0
    legacy_middleware_count: 0
    server_action_no_auth_count: 0
    convex_public_no_validator_count: 0
    missing_deployment_id_count: 0
    missing_server_actions_key_count: 0
    script_exit: 1
  accepted_kpi_signals:
    - evidence: "components/shell/app-shell.tsx:46"
      reason: "Native same-page skip link; focus verified in browser."
    - evidence: "app/(shell)/roadmap/page.tsx:110"
      reason: "Pre-existing decorative fixed-size image, with dimensions and lazy loading."
  verification:
    npm_audit_vulnerabilities: 0
    project_audit: PASS
    typecheck: PASS
    lint_errors: 0
    existing_lint_warnings: 59
    integrated_tests: "1131/1131 in 128 files"
    final_changed_edge_tests: "32/32 in 4 files"
    final_release_phase_tests: "3/3"
    production_build: PASS
    standalone_health_and_version: PASS
    no_env_next_start: PASS
    phase_identity_env_drift: PASS
    anonymous_browser: "23/23"
  deployment:
    status: pending-release
    observed_frontend_revision: 34561a9
    observed_frontend_next: "16.2.10"
    backend_deployed_by_review: false
    backfill_executed: false
    candidate_score_applies_to_production: false
  skipped:
    - "Authenticated candidate browser/OAuth/session-restart proof."
    - "Post-release backend/frontend parity and live snapshot backfill."
    - "First-load JavaScript size measurement."
    - "New hosted CI run."
    - "Self-hosted Convex checks: not applicable."
    - "Generic frontend/slices feature-layout script: incompatible project shape."
  open_questions:
    - "Production release and migration have not been authorized or performed."
```
