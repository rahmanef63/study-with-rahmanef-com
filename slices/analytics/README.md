# slices/analytics — per-course instructor aggregates (STATUS #17)

> Frontend host = the desktop OS shell (pivot 2026-07-07): alpha mounts this view
> inside the **kelola** window-app (`/kelola/<tenant>`), not as its own route. The
> pivot leaves the Convex backend unchanged — see AGENTS.md §0.

Read-only analytics for **instructor+**, deferred out of #3 ("agregat instructor+").
No new tables: every number is COMPUTED at read time from the shared tables
(`lessonCompletions`, `courseCompletions`, `memberships`, `quizzes`, `quizAttempts`,
`lessons`, `modules`) using bounded takes documented in
`convex/features/analytics/constants.ts`. The output carries no PII — numbers and titles only.

## Convex surface (instructor+ only — members are rejected with NOT_AUTHORIZED, tested)

| Function | Args | Returns |
|---|---|---|
| `api.features.analytics.queries.getCourseAnalytics` | `{ courseId }` | `{ course, memberCount, courseCompletionCount, totalLessons, lessons[], quizzes[] }` |
| `api.features.analytics.queries.listCourseSummaries` | `{ tenantId }` | `[{ courseId, slug, title, status, completionCount, memberCount }]` |

Authz: `requireUser` → course read → `requireTenantRole(instructor)` (auth-before-read,
the `courses/access.ts` pattern); `tenantId` always comes from the course row, never from args.

## Barrel (consumer contract)

- `CourseAnalyticsView({ courseId, copy?, className? })` — the full view for kelola.
- `useCourseSummaries(tenantId)` — summary numbers for the kelola course list.
- Presentational: `StatCard`, `LessonCompletionBars`, `QuizStatList` (props-driven).
- `ANALYTICS_COPY` / `mergeAnalyticsCopy` — Indonesian copy, overridable.
- `analyticsErrorMessage` / `extractAnalyticsError` — map ConvexError → copy.

## Design notes

- Bars use a `role="progressbar"` div + theme tokens (the slices/progress pattern) —
  no new chart library.
- `toPercent` is imported from the `@/features/progress` barrel (extract-on-second-occurrence;
  `shared/` is the integrator's surface).
- `courseCompletions` has no `by_course` index yet → the badge count is derived per
  active member via `by_user` (exact & bounded; badges held by former members are not
  counted). A `by_course` index proposal has been raised with alpha — see the TODO(rr)
  in `aggregate.ts`.
