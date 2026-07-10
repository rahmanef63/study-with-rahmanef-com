# slices/analytics — agregat instruktur per kelas (STATUS #17)

> Frontend host = OS desktop shell (pivot 2026-07-07): view ini di-mount alpha di
> window-app **kelola** (`/kelola/<tenant>`), bukan route sendiri. Backend Convex
> tidak berubah oleh pivot — lihat AGENTS.md §0.

Read-only analytics untuk **instructor+**, deferred dari #3 ("agregat instructor+").
Tanpa tabel baru: semua angka DIHITUNG saat read dari tabel shared
(`lessonCompletions`, `courseCompletions`, `memberships`, `quizzes`, `quizAttempts`,
`lessons`, `modules`) dengan bounded takes yang didokumentasikan di
`convex/features/analytics/constants.ts`. Output tanpa PII — hanya angka + judul.

## Convex surface (instructor+ saja — member ditolak NOT_AUTHORIZED, teruji)

| Fungsi | Args | Hasil |
|---|---|---|
| `api.features.analytics.queries.getCourseAnalytics` | `{ courseId }` | `{ course, memberCount, courseCompletionCount, totalLessons, lessons[], quizzes[] }` |
| `api.features.analytics.queries.listCourseSummaries` | `{ tenantId }` | `[{ courseId, slug, title, status, completionCount, memberCount }]` |

Authz: `requireUser` → course read → `requireTenantRole(instructor)` (auth-before-read,
pola `courses/access.ts`); `tenantId` selalu dari row course, bukan dari args.

## Barrel (kontrak konsumen)

- `CourseAnalyticsView({ courseId, copy?, className? })` — view lengkap untuk kelola.
- `useCourseSummaries(tenantId)` — angka ringkas untuk daftar kelas kelola.
- Presentasional: `StatCard`, `LessonCompletionBars`, `QuizStatList` (props-driven).
- `ANALYTICS_COPY` / `mergeAnalyticsCopy` — copy Bahasa Indonesia, bisa dioverride.
- `analyticsErrorMessage` / `extractAnalyticsError` — map ConvexError → copy.

## Catatan desain

- Bar pakai div `role="progressbar"` + theme tokens (pola slices/progress) — tanpa
  lib chart baru.
- `toPercent` diimpor dari barrel `@/features/progress` (extract-on-second-occurrence;
  `shared/` adalah permukaan integrator).
- `courseCompletions` belum punya index `by_course` → badge count diturunkan per
  member aktif via `by_user` (exact & bounded; badge ex-member tidak terhitung).
  Proposal index `by_course` diajukan ke alpha — lihat TODO(rr) di `aggregate.ts`.
