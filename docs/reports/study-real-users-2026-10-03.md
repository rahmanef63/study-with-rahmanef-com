# Study real users, cleanup and activity — 2026-10-03

## Changes delivered

Alpha integrated the release; beta implemented cleanup and independently reviewed the backend, gamma implemented account analytics, and delta implemented the existing analytics slice and browser checks. Unrelated canonical .agent content was preserved.

- Exactly three retired seed accounts were deleted with their three profiles/memberships, seven posts, twelve scripted comments, seventeen likes and three notifications. No learning records belonged to these accounts. The internal platform-admin migration rechecks exact seed provenance, authentication, privileges and ownership in the transaction; ambiguous accounts are protected. A subsequent preview returns zero for every count. Cleanup is unavailable through browser/MCP capabilities.
- Removed the seed's ability to create fictional accounts, discussions, suggestions or likes and deleted unused suggestion copy/types. Genuine owner-curated teaching/resources remain. Historical identity/thread constants exist only to verify retired demo provenance.
- [Admin → Pengguna](https://study-with.rahmanef.com/admin/pengguna) lists registered accounts, identities, learning status, recent activity and known source/location. Details show communities, current eligible course progress, material reads, quiz results, badges and page/link activity with source page, target, source/campaign, location and device. Search applies to loaded pages; pagination, CSV, bounded scroll regions and explicit partial/unknown states are included.
- Added authenticated /api/analytics/user ingestion alongside existing anonymous visitor analytics. Backend identity comes from the user's existing JWT; a separate server secret authorizes enrichment. Local GeoIP supplies coarse location and UA parsing supplies device/browser. No raw IP, URL queries, tokens, quiz answers or retrospective anonymous-to-user mapping is stored. Private/admin/account/callback paths are excluded; DNT/GPC opt out.
- Entry source survives sign-in for 30 minutes without perpetual renewal. Retention is 30 days, with per-account limits of 60/minute and 500/day, a durable global 10,000/day limit and bounded hourly purges. Missing historical geography/source remains unknown.
- Added MCP admin.users and admin.user_detail, delegating to the same guarded host queries. Two stable tools remain, with 12 user and 7 admin capabilities. User scope cannot access administrative account data.

Earlier changes: [phase 1 and phase 2](study-phase1-phase2-2026-10-03.md), [admin/analytics/richtext/MCP phase](study-phase3-2026-10-03.md).

## Data verification and rollback

Initial production inventory: 116 accounts/profiles, comprising three exact unauthenticated retired seeds and 113 other accounts with authentication records. A name containing “test” is not synthetic provenance.

Protected full backup before cleanup: 391,973 bytes, SHA256 74e900423b81df2f2f161b500bb47690eeb63d261e77c73df97b9f2d60bb3bfc. Backups/inventories stay outside source in a mode-700 operator directory with mode-600 files. A second protected export verified:

- All 113 original registered account documents remain unchanged; a new authenticated signup increased the remaining total to 114 during verification. Counts are snapshot values, not fixed product copy.
- Courses, lessons, placements, quizzes and tenants are unchanged. All genuine completions, badges, quiz attempts, views and assessments remain; one completion and fifteen material views arrived naturally during the release. View rollups increased consistently with ongoing activity.
- No reference to a deleted demo user remains, and genuine comments/posts have valid authors and comment parents. The owner/admin account remains available.

Frontend rollback tag study-with-rahmanef-com-inpwce:rollback-real-users-20261003 preserves prior image b81df7aab6929f090e033753952e2387a96f12a98840f818ff4beb5cbaaac91f and protected configuration. Backend schema additions are additive. Restoring cleanup requires a reviewed targeted plan from backup, rather than replacing concurrent live data wholesale.

Convex CLI 1.42.1's generic /api/function dispatch returned a server error for the internal preview without writes. The unchanged query succeeded through official subscription transport. A task-local adapter used the official typed query/mutation envelopes for the two exact cleanup functions, preserving CLI credential selection and identity. The dry-run and atomic execute returned identical counts; no guard or application source was weakened.

## Validation and production evidence

- Local regression: 1,296 passing tests plus one conditional GeoIP test; a separate run with the actual local database passed all four GeoIP tests, covering the conditional case. Typecheck, stack/slice/file-size audits and production build passed. ESLint: zero errors, 47 existing warnings. Production dependency audit: zero vulnerabilities; the existing bounded development-only advisory exception is unchanged. Final targeted cleanup/seed run: 31/31. Independent focused review: 29/29, scoped audit-bp 100/100 using current official Next/React/Convex documentation.
- [PR #6](https://github.com/rahmanef63/study-with-rahmanef-com/pull/6) merged with passing CI as 32fdf0778c24aa9e396c6585e36c8fda24af0251. Convex production rare-toucan-552 deployed successfully, with no deleted indexes. Both visitor and authenticated activity retention jobs are present in the live cron descriptor.
- Dokploy application nnD3Po5rSIYXBGhkZtsu_, deployment uVXG2moxMXNOL8_bdqkO-, finished successfully. Host checkout, build/runtime revision and public /api/health agree on the merged revision. Runtime image: d8fac756865e418c06f6855065a039fbbdda30a20b995ebf8a9de214a814221e; container is healthy. Existing auth/backend/GeoIP wiring was preserved.
- Production telemetry checks: missing JWT 401, cross-origin 403, forged actor/location/private path 400, DNT/GPC 204 and invalid JWT rejected by backend without recording an event. MCP endpoints reject missing credentials with 401.
- Natural authenticated activity supplies positive production evidence without fabricated sessions: the post-cleanup snapshot contains 17 events (9 pages, 8 clicks), with country/city/device known and source-page/target present for every click. Later guarded admin detail returned 40 events (20 pages, 20 clicks), 26 reads, one completed lesson and learning status “belajar”. Referrer/campaign was absent on this visit and correctly remains unknown.
- Live modern and legacy MCP clients initialized, rescanned descriptors/signatures, read account lists/details and rejected cross-scope admin calls. Both tools and all 19 capabilities match the release contract. The two task-owned temporary PATs were revoked; both live endpoints then returned 401, and plaintext tokens were removed.
- Native T3 automation initially preserved the admin gate, then explicitly reported an unavailable host. Fallback browser checks verified nine disconnected presentation scenarios and eight anonymous production checks at 1440×900 and 390×844: no overflow/runtime errors, contained sticky tables, keyboard pagination/search, CSV download, correct admin denial and public material navigation. The referenced material has one back link and remains member-gated. Operator browser contexts used DNT, no cookies/auth storage, and were closed afterward.

Presentation fixtures and production anonymous checks do not prove the signed-in production dashboard or member richtext body visually. Those browser checks remain a verification limit; guarded production reads, natural telemetry and component tests provide separate evidence. Account-linked click/location history starts with this release; existing learning history is available immediately.
