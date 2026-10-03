# Study with Rahmanef — phase 1 / phase 2 change ledger

Phase 1 was merged through PR #1 and published at `4eab003f35a13dbaacd79744bb730fc9517c50f9`. Phase 2 starts at evidence commit `50b302c`, isolated branch `feat/study-phase2-20261002`. Integrator alpha; beta comments, gamma profiles/cleanup audit, delta independent browser/review. Maximum four concurrent agents. The canonical checkout's unrelated `.agent/` remains untouched. No new dependency, production seed, content change or auth migration is included in phase 2.

## Phase 1 — released 2026-10-02

- Updated Next/eslint-config-next to 16.3.8, Vitest to 4.1.11 and vulnerable transitive packages; dependency audit became clean.
- Denied access to pending/suspended communities through the shared guard while preserving the platform-admin approval workflow.
- Corrected exact lesson completion lookup for long histories; counted only published same-tenant placements and suppressed misleading completion/badges when data is truncated.
- Added transactional placement eligibility snapshots, bounded course/reuse work and idempotent deferred badge settlement. Backfilled all 134 production placements; an independent complete scan found zero mismatches. No user progress/content/membership was rewritten.
- Added start/resume/review class actions and a return action after the final lesson. Quiz state resets per quiz, submission locks prevent duplicate requests, attempt limits/retries follow server data, and result focus improves keyboard access.
- Improved skip navigation, heading hierarchy, reduced motion, syllabus accessibility, landing streaming/images and internal roadmap links.
- Persisted release identity; health/version report frontend readiness and source revision, sanitized framework error logging, added security headers and Docker health checks.
- Expanded CI with project contracts, dependency checks, unit/authz tests, production build and standalone readiness. Final hosted CI passed 1,134 tests; candidate anonymous browser suite passed 23 checks.
- Repaired the existing Dokploy public Git source and pinned exact APP_REVISION in build/runtime. Production backend/frontend and migration were verified. Automatic deployment stays disabled until commit-aware injection is proved.

The phase 1 audit score covered its changed scope, not every screen. Authenticated reader/browser acceptance was absent; the user's phase 2 screenshot identifies that gap. Full evidence: [source candidate](study-improvements-2026-10-02.md), [phase 1 release](study-release-2026-10-02.md).

## Phase 2 — reader, comments, related UI and cleanup

### Reader and navigation

- Desktop reader uses a bounded viewport grid: syllabus remains in place, syllabus rows and reading/discussion pane scroll independently. Mobile keeps document reading and a native syllabus disclosure with a bounded list.
- Removed the secondary syllabus return action. The route owns one header “Kembali ke kelas”; previous/next and final-lesson return actions remain purposeful footer navigation.
- Removed the duplicate quiz return action from its mounted view; the route link remains available during loading and membership gates.
- Completion and quiz submission bars account for the mobile dock and safe area. Completion has an opaque background so prose does not show through.
- Lesson navigation remounts the reader per lesson, resetting scroll. The syllabus uses 44px rows and a focusable scroll region; loading/incomplete progress displays honest status, without invented 0/N percentages or inferred next lessons.
- Positioned the syllabus scroll region so absolutely positioned screen-reader status text cannot escape clipping. Browser reproduction: document height 1,950px before this fix, 900px after it at a 900px viewport.
- Long unbroken markdown words wrap within the reading surface. Material/skill/discussion return links now have 44px touch areas and visible focus.

### Comments

- Bounded and named the comment/reply scroll region; root composer stays outside it. Long body/author text wraps without horizontal page overflow.
- Keyed sessions by lesson/post so drafts, reply forms and deletion selections do not carry to another target. Post and material copy is now accurate to context.
- Disabled busy input/cancel controls and added synchronous mutation locks. Failed sends retain drafts; failed deletes retain confirmation, and pending deletes cannot be dismissed into a new selection.
- Raised reply, delete and composer controls to 44px; exposed reply expansion and busy state to assistive technology.

### Other audited screens

- Removed nested main landmarks and duplicate shell gutters from sign-in, changelog, assessment and certificate routes; added an AST regression guard for all shelled routes.
- Public profile retains one named title, biography and primary share action. Avatar, owner edit and badges remain. Standalone/client recovery still supplies its own title when the server read had no heading.
- Certificate retains its document details but demotes its secondary document heading and suppresses its extra copy action when the route has supplied the real heading/share action. Server-null recovery preserves a named client title.
- Replaced old English arcade offline copy with Indonesian recovery instructions. Bumped the service-worker cache to v5 to refresh the precached offline page.
- Added this phase's user-facing changelog and a reusable disconnected reader fixture outside production routes. Vitest now resolves the same feature alias as TypeScript/Next, enabling real cross-slice presentation regressions.

### Proven unused code removed

| Removed | Usage evidence / retained contract |
|---|---|
| QuickActionRow, QuickAction type, ViewToggle, their exports/icons | Whole-source search found definitions/exports only; active CommandSearch/FilterChip retained |
| `.scroll-minimal` and scrollbar rules | Its only remaining consumer was the removed QuickActionRow; retired OS AppScroll is absent |
| Unused full Logo lockup | All actual consumers import LogoMark, which remains |
| Three `lib/headless-core` files | No runtime/source imports; removed the obsolete smoke-test existence requirement. Actual release identity remains in the current server-release implementation |
| useAgentTools/noArgs/num compatibility stubs | No consumers; notion-app's used defineToolCollection/obj/str remain |
| Unused UI imports and ShellAction callback prop | Checked every call site; working menu navigation callbacks elsewhere remain |

Stored cover/avatar URLs can refer to assets without source imports. No asset purge or retirement of load-bearing redirects was inferred from a text search.

## Verification and limits

- Full suite: **1,160 tests / 133 files passed**. Focused comment, navigation, course and profile regressions passed.
- TypeScript, project contracts and production build passed. Contracts checked 732 source files and 17 slice metadata pairs; zero violations. Dependency audit: zero vulnerabilities. ESLint: zero errors, **47 warnings**, reduced from phase 1's 59; remaining warnings are not claimed fixed.
- Native T3 browser inspected the actual React presentation with 40 lessons, long markdown and long comments, using a disconnected local Convex adapter. At 1440×900: document 900px, reader 776px, syllabus 683px; independent scrolling left document scroll at zero. Comments were 512px and scrolled independently with composer outside.
- Native keyboard Tab traversed all 40 syllabus links; the last became visible. Native PageDown/CtrlEnd automation did not produce reliable scroll and is not counted as a successful keyboard-scroll check.
- At 375×812: native mobile disclosure and document reading worked, no horizontal overflow, 44px controls; completion/quiz controls clear the dock. Safe-area geometry was checked at 0 and simulated 20px. The fixture was corrected to include RootLayout's existing safe-area variables; missing fixture variables were not mistaken for a production defect.
- Failed comment add/delete, target draft/reply/dialog reset, and quiz submit/result focus were exercised through actual hooks with local transport. No production member data was written.
- This fixture proves layout and interaction, not OAuth, live authorization, real quiz grading or user session restart. Those backend contracts are unchanged in phase 2. Actual async profile/certificate route acceptance and exact production release evidence are recorded after publication below.

Independent changed-scope audit-bp: **94/100, APPROVE**, no source blocker. Context7 consulted official Next.js, React and Convex documentation. Remaining medium validation follow-up: actual async server route success and server-null/client recovery, as recommended by [Next testing guidance](https://nextjs.org/docs/app/guides/testing/vitest).

```yaml
audit_bp:
  scope: phase2_changed_only
  score: 94
  verdict: APPROVE
  source_blockers: []
  remaining_validation:
    - async_profile_certificate_route_success_and_recovery
    - authenticated_production_session_not_available
```

## Publication

Release evidence pending the final PR/CI and exact main deployment. Prior owner authorization for main merge/publication remains applicable. Frontend rollback is preserved as `study-with-rahmanef-com-inpwce:rollback-phase2-20261003`, image `sha256:74b07b74a13d78823db3df74b9d824155428cae528e06ad9d7df2b80ca9ee15e`. Runtime config backup is private and contains no committed secret. Backend functions/data are unchanged.
