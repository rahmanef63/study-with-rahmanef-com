# courses — kelas/modul/lesson + lesson player

> **OS pivot (2026-07):** view slice ini sekarang di-mount di dalam **window-app os-shell** via deep-link (mis. `/komunitas/<tenant>`, `/kelas/<tenant>/<course>`, `/profil/<username>`), BUKAN route Next. Path route Next di bawah ini **historis / ilustratif** — skema deep-link ada di AGENTS.md §0 + docs/SLICES.md. Hanya `app/admin/*` yang tetap route asli.

STATUS row **#2** (v1, R4). Backend: `convex/features/courses/`. Agent: gamma.

## Mount points (integrator)

| Route | Export | Notes |
|---|---|---|
| `/t/[slug]` (section) | `CourseCatalog` | needs `tenantId` + `courseHref` builder |
| `/t/[slug]/kelas/[kelasSlug]` | `CourseOverviewView` | public etalase; pass `joinCtaSlot` (tenants) |
| `…/belajar/[lessonId]` | `LessonPlayerView` | member-only (query enforces); pass `completionSlot` (progress #3) |
| `/t/[slug]/kelola/kelas` | `ManageCoursesView` | instructor+ (query enforces) |
| `/t/[slug]/kelola/kelas/[courseId]` | `ManageCourseEditorView` | instructor+ |

All routing is prop-injected (`lessonHref`, `courseHref`, `backHref`) — the slice never hardcodes URL schemes.

## Consumer seams

- **progress (#3):** `SyllabusList.completedLessonIds`, `CourseOverview.progressSlot`, `LessonView.completionSlot`, types `LessonViewData` / `SyllabusModuleData`. Lesson counts: query `lessons` `by_course` directly in your convex feature (tables are shared; UI crosses only via this barrel).
- **landing (#5):** `CourseCard`, `usePublishedCourses`, or `CourseCatalog` wholesale.

## Security posture (P0)

Draft courses are invisible to members inside the queries (`NOT_FOUND`, no existence leak). `youtubeVideoId` accepts only an 11-char ID in mutations; the embed origin is pinned to `youtube-nocookie.com`. Markdown renders through a typed AST — no `dangerouslySetInnerHTML`; only `http(s)` links linkify.

## Tests

`convex/features/courses/*.test.ts` (convex-test incl. authz-denied + draft-invisibility paths) and `slices/courses/__tests__/` (parser, YouTube helpers, barrel contract — type-level until vitest gets tsconfig aliases; see barrel.test.ts TODO).
