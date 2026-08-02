# progress slice

Self-paced progress tracking for **belajar-with-rahmanef.com** (STATUS row #3, v1).
Owns tables `lessonCompletions` and `courseCompletions`; reads the shared
`lessons`/`courses` tables to derive progress. No routes — this slice fills the
**courses** barrel seams.

## Barrel (`@/features/progress`)

| Kind | Exports |
|---|---|
| Views (connected) | `CourseProgress`, `LessonCompletion` |
| Components (presentational) | `CourseProgressBar`, `CompletionButton` |
| Hooks | `useCourseProgress`, `useLessonCompletion`, `useMarkLessonComplete` |
| Lib (pure) | `toPercent`, `progressErrorMessage`, `extractProgressError` |
| Copy / config | `PROGRESS_COPY`, `mergeProgressCopy`, `progressFeature` |
| Types | `CourseProgressData`, `LessonCompletionData`, `MarkLessonCompleteResult`, `ProgressErrorCode` |

## How the integrator wires it into courses

```tsx
// lesson player
<LessonView
  lesson={lesson}
  completionSlot={<LessonCompletion lessonId={lesson._id} />}
  /* … */
/>

// course overview
const progress = useCourseProgress(courseId);
<CourseOverview
  overview={overview}
  completedLessonIds={progress?.completedLessonIds}
  progressSlot={<CourseProgress courseId={courseId} />}
  /* … */
/>
```

Convex functions (call via `api.features.progress.*`):

- `mutations.markLessonComplete({ lessonId })` — member; idempotent.
- `queries.getCourseProgress({ courseId })` — member; derived counts + completed ids.
- `queries.getLessonCompletion({ lessonId })` — member; the caller's own boolean.

## Invariants (docs/DATA-MODEL.md)

- **Progress is derived, never stored** — counted from `by_user_course` / `by_course`
  indexes on every read; percentages are computed in the client (`toPercent`).
- **Idempotent twice** — `markLessonComplete` checks `by_user_lesson` before inserting a
  lesson completion, and `by_user_course` before minting a `courseCompletion` (badge).
- **A user writes only their own completions** — `userId` comes from `ctx` via the authz
  helper, never from args (P0). Every function's first line is `requireUser` →
  `requireTenantRole(member)` on the row's own `tenantId`.
- Draft/archived courses are `NOT_FOUND` for plain members (mirrors `courses.getLesson`)
  so no badge is earned before publish.

## Cross-slice rule

Progress **never imports the courses feature** (no barrel import, no deep import). It
reads the shared schema tables directly — that is table access, not code coupling — which
is exactly how the DATA-MODEL defines progress derivation.
