# slices/analytics — per-course instructor aggregates (STATUS #17)

> Frontend host = the **Kelola › Statistik** tab at `/k/<tenant>/kelola` (route pivot
> 2026-08-09), not its own route. The Convex backend is unchanged by that pivot —
> see AGENTS.md §0.
>
> **0.3.0 (2026-08-11): reader counts.** The slice now spans TWO Convex features —
> `analytics` (how much) and `insight` (who read what). New: `TenantPulseView`,
> `CourseFunnelView` (the drop-off), `MateriViewRecorder` (the one write), and the
> pure `biggestDrop` / `lostBefore` / `funnelEnds` arithmetic.
>
> **⚠ EVERY READER NUMBER COUNTS LOGGED-IN MEMBERS ONLY**, once per materi per WIB
> day. Anonymous reads — the etalase, search arrivals, every permalink opened by
> someone logged out — are invisible to it. `MembersOnlyNote` exists so that
> qualifier ships beside the numbers; do not render a view count without it.
>
> **0.2.0 (DECISIONS #37, materi model):** the per-module grouping is GONE.
> `LessonCompletionBars` renders a FLAT per-materi list in `courseLessons.order`, and
> `ModuleQuizStat` is now `CourseQuizStat` (a quiz belongs to the course).
> As of 0.3.0 `CourseAnalyticsView` no longer mounts it — `FunnelStepList` renders the
> same materi with reads AND completions. It stays exported for a consumer that has
> `analytics` without `insight`.

Read-only analytics for **instructor+**, deferred out of #3 ("agregat instructor+").
No new tables: every number is COMPUTED at read time from the shared tables
(`lessonCompletions`, `courseCompletions`, `memberships`, `quizzes`, `quizAttempts`,
`lessons`, `courseLessons`) using bounded takes documented in
`convex/features/analytics/constants.ts`. The output carries no PII — numbers and titles only.

## Convex surface (instructor+ only — members are rejected with NOT_AUTHORIZED, tested)

| Function | Args | Returns |
|---|---|---|
| `api.features.analytics.queries.getCourseAnalytics` | `{ courseId }` | `{ course, memberCount, courseCompletionCount, totalLessons, lessons[], quizzes[] }` |
| `api.features.analytics.queries.listCourseSummaries` | `{ tenantId }` | `[{ courseId, slug, title, status, completionCount, memberCount }]` |
| `api.features.insight.funnel.courseFunnel` | `{ courseId }` | `{ course, memberCount, startedCount, steps[] }` |
| `api.features.insight.pulse.tenantPulse` | `{ tenantId }` | `{ memberCount, activeThisWeek, completions…, materiCount, neverReadCount, mostRead[], leastRead[] }` |

Plus ONE member-level mutation: `api.features.insight.views.recordView({ lessonId })`,
called only by `MateriViewRecorder`. Idempotent per member per materi per WIB day.

`FunnelStep.viewedCount` is DISTINCT MEMBERS; `viewCount` is member-days. Never build a
funnel on the latter — re-reads would push retention above 100%.

Authz: `requireUser` → course read → `requireTenantRole(instructor)` (auth-before-read,
the `courses/access.ts` pattern); `tenantId` always comes from the course row, never from args.

## Barrel (consumer contract)

- `CourseAnalyticsView({ courseId, copy?, className? })` — the full per-course view
  (stat cards → `CourseFunnelView` → quiz stats).
- `TenantPulseView({ tenantId, materiHref?, copy? })` — the community screen above it.
- `CourseFunnelView({ courseId, copy? })` — the drop-off on its own.
- `MateriViewRecorder({ tenantId, lessonId })` — renders `null`; mount on a reading
  surface. Fires once per mount, members only, never on prefetch, never blocking,
  errors swallowed. Mounted today by the materi permalink, the skill permalink and
  the in-course reader — the third is where almost all reading happens, so removing
  it would flatten every funnel to zero.
- `useCourseSummaries(tenantId)` — summary numbers for the kelola course list.
- Presentational: `StatCard`, `LessonCompletionBars` (flat `LessonCompletionStat[]`),
  `QuizStatList` (flat `CourseQuizStat[]`) — all props-driven.
- `ANALYTICS_COPY` / `mergeAnalyticsCopy` — Indonesian copy, overridable.
- `analyticsErrorMessage` / `extractAnalyticsError` — map ConvexError → copy.

## Design notes

- Bars use a `role="progressbar"` div + theme tokens (the slices/progress pattern).
- **Exactly one chart** (`FunnelCurve`, recharts, code-split behind `next/dynamic`).
  It earns its place because retention is a SHAPE — an even trickle and a cliff at
  materi three are different problems — and no column of percentages shows that at a
  glance. It is `aria-hidden` behind a sentence label; `FunnelStepList` below it is
  the accessible truth, and `MIN_POINTS = 3` stops it drawing a two-dot line.
- `biggestDrop` ranks by PEOPLE, not percent: a 100% fall from two stragglers must not
  outrank a 58-person cliff. Ties go to the earliest step (it is upstream of the rest).
- Where a chart was NOT used: the pulse numbers, the read distribution and the quiz
  stats are all single values or short ordered lists, which a list states better.
- `toPercent` is imported from the `@/features/progress` barrel (extract-on-second-occurrence;
  `shared/` is the integrator's surface).
- `courseCompletions` has no `by_course` index yet → the badge count is derived per
  active member via `by_user` (exact & bounded; badges held by former members are not
  counted). A `by_course` index proposal has been raised with alpha — see the TODO(rr)
  in `aggregate.ts`.

## Platform admin analytics (0.4.0)

The host's `/admin/statistik` route owns the page heading and gates on the
current authenticated profile before enabling `PlatformAnalyticsView`.
`usePlatformAnalytics` additionally waits for Convex authentication; the server
query `features/analytics/platform:getPlatformAnalytics` always authorizes the
platform admin before reading any data. Anonymous server rendering must never
call this query.

`PlatformAnalyticsDashboard({ data, days, onDaysChange, copy? })` is a portable
presentation for inventory, selected-period learner activity, a WIB daily trend,
and comparable community/course/materi/quiz tables. Periods are 7/30/90 days;
there are no invented previous-period comparisons. Search/community filters only
change comparison tables; the inventory and trend remain platform-wide.

Every bounded source reports completeness, Count objects carry `exact`, and
partial totals render as minimums (`≥`). CSV exports reflect currently filtered,
sorted aggregate rows and retain coverage columns; spreadsheet formulas in
labels are neutralized. Nothing exports account identities. Member-day readings
are distinct from anonymous website visits, and trial-based quiz pass rates are
not a learner-cohort conversion metric. Tables contain their horizontal/vertical
scrolling and have keyboard-focusable named regions; every touch control is 44px.

## First-party visitor analytics (0.4.0)

`PlatformTrafficView({ enabled, copy? })` uses the same host-admin + authenticated
query gate. `/admin/pengunjung` owns its heading. The portable
`PlatformTrafficDashboard({ data, days, onDaysChange, copy? })` accepts 7/30 days
and renders page views, temporary browser sessions, CTA clicks, direct/unknown
sources, rejected events, daily/local-hour trends, twelve ranking tables and
masked recent sessions. Filtered/sorted CSV exports carry source completeness;
session timestamps export as ISO UTC and display in WIB.

Sessions do not identify people across visits. The UI states the 30-day
retention, the gap before instrumentation, and that the earliest retained event
is not the actual deployment/start date. Missing countries remain unknown; no
city or country is inferred from timezone/language. Learning views and website
traffic stay separate metrics. The backend collector/authorization/retention
remain authoritative and are not recreated by these presentation components.


## 0.5.0 — account-level admin analytics

The host admin layout authorizes before mounting `PlatformUsersView` or
`PlatformUserDetailView`. Both hooks also wait for authenticated Convex state;
the backend independently requires a current platform-admin profile.
`detailHref` and `geoAttributionHref` are host props. The host owns the page h1.

`PlatformUsersDashboard` is controlled and props-driven: `rows`, `search`,
`onSearchChange`, `status`, `onLoadMore`, and `detailHref`. Search covers loaded
account pages, including users without profiles; an empty page is not an
exhausted cursor. Search is capped at the backend's 100-character contract.
CSV exports contain only displayed accounts, require an explicit click, and
reuse formula-safe aggregate serialization.

Detail tables separate current eligible course progress from historical badges.
Incomplete sources show lower bounds and unavailable percentages/status rather
than claiming exact completion. Missing role or learning evidence stays unknown.
Member-day reads are not page views. Account traffic has its own authenticated
boundary and timeline; historical anonymous sessions are never attributed to
people. Unknown source/location is explicit. Click destinations remain text,
not executable links, with bounded scrolling and sticky table headings.

The disconnected `e2e/admin-fixture` views `users` and `user-detail` exercise
synthetic long text, partial/empty/loading states, search, pagination, CSV and
contained scroll. They do not prove real authentication or production data.
