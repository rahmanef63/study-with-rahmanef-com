# courses — kelas (a curated playlist of materi) + the materi player

STATUS row **#2**. Backend: `convex/features/courses/`.

> **MATERI MODEL (DECISIONS #37).** A materi belongs to the COMMUNITY, not to a
> course. A course is a flat ordered list of PLACEMENTS (`courseLessons`) — a
> curated playlist. There is no module tree: nothing in this slice exposes
> `modules`, `moduleId`, or a nested syllabus, and removing a materi from a
> course unplaces it without deleting it.

## Mount points (integrator)

| Route | Export | Notes |
|---|---|---|
| `/k/[slug]` (section) | `CourseCatalog` | needs `tenantId` + `courseHref` builder |
| `/k/[slug]/kelas/[courseSlug]` | `CourseOverviewView` | public etalase; pass `joinCtaSlot` (tenants) and `quizSlot` (quiz slice) |
| `/k/[slug]/kelas/[courseSlug]/[lessonId]` | `LessonPlayerView` | member-only (query enforces); pass `completionSlot` (progress #3) and `courseId` as reading context |
| `/k/[slug]/kelola` › Kelas | `ManageCoursesView` | instructor+ (query enforces) |
| ↳ per-course editor | `ManageCourseEditorView` | instructor+; edits PLACEMENTS |

All routing is prop-injected (`lessonHref`, `courseHref`, `backHref`) — the slice never hardcodes URL schemes.

## Consumer seams

- **progress (#3):** `SyllabusList.completedLessonIds`, `CourseOverview.progressSlot`, `LessonView.completionSlot`, types `LessonViewData` / `SyllabusLessonData`. Materi counts: read `courseLessons` `by_course` in your convex feature (tables are shared; UI crosses only via this barrel).
- **quiz (#8):** `CourseOverview.quizSlot` / `CourseOverviewView.quizSlot` — the course's quizzes render as the last `<li>` rows of the silabus list.
- **landing (#5):** `CourseCard`, `usePublishedCourses`, or `CourseCatalog` wholesale.

## Security posture (P0)

Draft courses are invisible to members inside the queries (`NOT_FOUND`, no existence leak). A DRAFT MATERI is invisible to members too, and independently: the course's own draft status gates the course page only, never the materi. `youtubeVideoId` accepts only an 11-char ID in mutations; the embed origin is pinned to `youtube-nocookie.com`. Markdown renders through a typed AST — no `dangerouslySetInnerHTML`; only `http(s)` links linkify.

## Tests

`convex/features/courses/*.test.ts` (convex-test incl. authz-denied + draft-invisibility paths) and `slices/courses/__tests__/` (parser, YouTube helpers, barrel contract — type-level until vitest gets tsconfig aliases; see barrel.test.ts TODO).
