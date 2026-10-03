# Study real-user cleanup and analytics — 2026-10-03

## Scope and ownership

Alpha integrates feat/study-real-users-20261003 in an isolated worktree; canonical main retains unrelated owner .agent content. Beta implemented safe demo cleanup and independently reviewed account analytics; gamma implemented guarded projections, ingestion and retention; delta implemented the existing analytics slice UI and browser presentation checks. Earlier phase1/phase2 changes are listed in study-phase1-phase2-2026-10-03.md; phase3 is in study-phase3-2026-10-03.md.

Initial production frontend revision501f6a60f1053cf40f4420f1fb7dcc6c67ce5ad9 on Dokploy applicationnnD3Po5rSIYXBGhkZtsu_; production data owner is Convex Cloud rare-toucan-552. Readonly inventory found116accounts, all116profiles: three exact retired engagement seed accounts with no auth account/session and113other accounts with auth account records. Names containing test are not proof of demo provenance. No real/ambiguous account is a cleanup candidate.

## Changes

- Internal platform-admin-only preview/execute cleanup rechecks exact seed email/name/profile, authentication, roles and ownership; caps abort the whole transaction. It deletes synthetic users/memberships/engagement/history, reconciles likes/points/member-day counters and activity timestamps, retains genuine replies, and is idempotent. Owner-curated teaching/resources remain. The engagement seed can no longer create fictional users, conversations, suggestions or likes; unused suggestion seed copy/type removed. Historical identity/thread constants remain only as cleanup provenance.
- /admin/pengguna lists registered accounts, profile/email, learning status, activity and latest known coarse source/location. Account detail displays communities, eligible published course progress, material reads, quiz results, earned badges and authenticated page/click timeline. Counts expose lower bounds; unknown status/role are explicit. Exact course badge lookup is independent of bounded aggregate history.
- A separate authenticated /api/analytics/user route forwards the existing user JWT to Convex with a server-only enrichment secret. Identity is derived by requireUser, geography by the existing local GeoIP reader, and device by coarse UA classification. No raw IP, query, token, answer or anonymous-to-user linkage is stored. Record allowed learning pages and sanitized internal/external link targets with source page/referrer host/UTM campaign. Private/admin/account/callback destinations are excluded; DNT/GPC opt out. Entry source survives sign-in within30minutes and expires without perpetual token-refresh/SPA renewal.
- Authenticated budgets:60/minute and500/day per account, durable10,000/day global limit,30-day events,2-day per-user budget expiry,32-day daily-counter expiry; hourly500-per-table purge. Public account-free visitor telemetry remains unchanged.
- Two new admin MCP capabilities reuse the exact guarded browser handlers: admin.users and admin.user_detail. Two stable tools remain; descriptors/signatures update and clients must rescan. User scope cannot read other accounts. Demo cleanup is never an MCP capability.

## Backup and rollback

Protected full database ZIP exported before changes (391,973bytes; SHA25674e900423b81df2f2f161b500bb47690eeb63d261e77c73df97b9f2d60bb3bfc). Private inventories/configuration are mode600 under a mode700 operator directory and excluded from source. No auth credentials are logged or copied into this report. Teaching data and real accounts must be independently compared after cleanup. Restore requires a targeted operator plan from backup, not blanket replacement of live data. Frontend rollback tag study-with-rahmanef-com-inpwce:rollback-real-users-20261003 preserves imageb81df7aab6929f090e033753952e2387a96f12a98840f818ff4beb5cbaaac91f; previous runtime config is privately backed up. The schema extension is additive; frontend rollback does not require deleting new tables.

## Verification

Full local regression:1296passed,1conditional GeoIP-file test skipped,156files. Typecheck, slice/stack/file-size checks and production build passed. ESLint reports0errors/47existingwarnings; production dependency audit0vulnerabilities, with the already documented development-only braces advisory exception unchanged. After unused seed-copy removal, the targeted cleanup/seed suite also passed26/26. Independent focused review29/29tests; scoped audit-bp100/100 APPROVE, using current Context7 Next/React/Convex documentation. Whole-repository KPI scans239files across the default recent-change scope: zero unbounded collect, validators/access/secret bypass findings; one raw anchor and one raw image are pre-existing intentional external-image/fixture paths, inspected separately. Source review is scoped, not a claim that the whole legacy repository is defect-free.

Native T3 initially preserved the production admin gate screenshot, then its automation host became unavailable; preview_open explicitly allowed fallback. Existing browser tooling verified only the disconnected synthetic presentation fixture at1440×900 and390×844: oneh1, no page overflow, contained independently scrolling/sticky timeline, long identities, unknown/partial/loading/empty/denied states, keyboard pagination/search retention and CSV download. Fixture identities cannot authenticate in production. No OAuth/browser token was minted or restored. Historical learning data can be shown immediately; account-linked click/location history starts with this release. A real signed-in browser ingestion check remains an explicit verification limit unless actual user activity arrives naturally.

## Release evidence

Pending integration and production verification.
