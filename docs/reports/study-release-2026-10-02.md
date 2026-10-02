# Verified production release — Study with Rahmanef, 2026-10-02

Rahman explicitly approved merge and publication after the reviewable candidate and backend/frontend/backfill proposal. [PR #1](https://github.com/rahmanef63/study-with-rahmanef-com/pull/1) merged at 22:52:16 UTC to main as `4eab003f35a13dbaacd79744bb730fc9517c50f9`. Application behavior is published at [study-with.rahmanef.com](https://study-with.rahmanef.com). Later documentation-only evidence commits do not require rebuilding this verified application release.

## Published state and proof

| Layer | Verified result |
|---|---|
| Main release | Exact merge SHA above; candidate source and final documentation CI passed |
| Hosted main CI | [Run 37074764765](https://github.com/rahmanef63/study-with-rahmanef-com/actions/runs/37074764765): success; lint/types/contracts/advisories, all 1,134 unit tests, production build and standalone readiness |
| Convex Cloud | Functions/schema deployed successfully to rare-toucan-552, with typecheck enabled; no indexes deleted |
| Frontend source | Dokploy checkout HEAD equals the merge SHA |
| Dokploy | Application nnD3Po5rSIYXBGhkZtsu_; deployment A_kxKz83Bbgw9PZcIVAnH done |
| Container | f90c5f5a7bae healthy, failingStreak=0, Next 16.3.8 |
| Image | sha256:74b07b74a13d78823db3df74b9d824155428cae528e06ad9d7df2b80ca9ee15e |
| Build/runtime identity | Persisted deploymentId and runtime APP_REVISION equal the merge SHA |
| Public health/version | HTTP 200; status ok, ID/revision exact merge SHA; no-store, nosniff, frame-ancestor protection, Cloudflare DYNAMIC |
| Independent public smoke | Main/roadmap/login/start/home/community/changelog/offline/admin and canonical community/course/materials/skills routes return 200 HTML |

Frontend health is inherited from the image's HEALTHCHECK; a null service-level override does not mean that the running container lacks health monitoring. Swarm start-first update completed and replaced the old task. Frontend publication and backend publication were checked separately.

## Migration

The operator-only function features/progress/placementBackfill:run was pinned to the exact production deployment. Each phase began at cursor null, traversed every returned cursor and finished with isDone=true. Dry-run and verification performed no writes.

| Phase | Pages | Scanned | Updated | Mismatches |
|---|---:|---:|---:|---:|
| Dry-run | 14 | 134 | 0 | 134 |
| Write | 14 | 134 | 134 | 134 |
| Independent verify-only | 14 | 134 | 0 | 0 |

Only courseLessons.lessonPublished booleans changed. Course content, completion history, badges, membership and authentication configuration were preserved. Page-size/response/count/cursor contracts and cross-phase parity passed. No seed, purge, auth-key rotation or destructive cleanup was performed.

## Deployment repair and future operation

Installed Dokploy v0.30.8 rejected the previous sourceType=github configuration because githubId was missing. The public repository needs no Git credential, so the same application now clones its HTTPS Git source on main, custom build path / and Docker context . . Both runtime env and buildArgs receive the exact APP_REVISION; installed Dokploy does not copy application runtime env into Docker build arguments automatically. The unused legacy CONVEX_ADMIN_KEY build argument was removed with the original configuration retained privately. Unrelated configuration/build secrets were preserved.

Automatic deployment is disabled: a static APP_REVISION must not be reused for a later source build. Follow [DEPLOY](../DEPLOY.md) to update the revision before each authorized release. Re-enable automation only after the commit-aware revision updater and source webhook are verified.

Previous image remains tagged study-with-rahmanef-com-inpwce:rollback-20261002 at sha256:80cbc9a6d3401ca33328cf6998b042a670d705a4026e8fde4f0a5cb7b92e3e4a. Private rollback configuration and migration checkpoints are stored outside git with restricted permissions. Backend rollback after migration must retain the optional snapshot schema field; never discard user history to roll back functions.

## Evidence and limits

Aggregate artifacts: /tmp/study-backfill-release-summary.json, /tmp/study-live-release-health.json, /tmp/study-convex-release-deploy.log and /tmp/study-release-source-config.json. Independent delta verified app configuration, actual checkout, running image/build identity, public responses and rollback retention without changing production.

Authenticated member/owner/OAuth/session-restart browser behavior was not exercised: no recorded auth state was available. Their logic passed unit and authorization checks; publication does not turn that limit into a browser pass. Browser evidence below records the anonymous live acceptance result separately from the earlier candidate's 23 passing browser tests.


Anonymous live browser acceptance passed on T3 tab_b: exact health/version SHA, settled desktop/mobile landing/community/course pages with one h1, contained layout and loaded assets, nine real course links and actual link navigation. At 375×812, the primary landing CTA is 44px tall and above the fold. Keyboard navigation transferred activeElement to main at both sizes. The live session was anonymous and retained the expected membership gate; no login or member mutation was attempted.

Live DOM evidence: /tmp/study-live-browser-qa-20261002.json. Native production recording: /home/rahman/.t3/userdata/attachments/0e9c8abc-1bf5-4f8a-b99a-8ede3fdc1b4d-7d76fb34-faac-4321-9dd8-c4b66cf9aceb-mp4.mp4. Snapshot/save tools failed client execution, so no new live PNG is claimed. The background browser's document.hasFocus=false limits visual focus-style proof; no live reduced-motion emulator was exposed. The live CSSOM guard was verified, while visual focus and actual reduced-motion emulation remain supported by the earlier passing candidate tests.
