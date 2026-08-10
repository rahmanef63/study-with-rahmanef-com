# quiz — MCQ builder + attempt + auto-grade

STATUS row **#8**. Backend: `convex/features/quiz/`.

> **MATERI MODEL (DECISIONS #37).** A quiz belongs to a COURSE and is addressed
> by its own id. A course may hold several (server cap
> `MAX_QUIZZES_PER_COURSE`) and the route is `/kuis/<quizId>`.

Instructors build a quiz (MCQ, 2–6 options, one correct key,
optional explanation, passing score %); members take it; grading is
**server-side**. The correct answers and explanations **never** reach the client
before an attempt is submitted (P0).

## Mount points (integrator)

| Route | Export | Notes |
|---|---|---|
| `/k/[slug]/kelola` › Kuis | `QuizBuilderView` | instructor+ (query/mutation enforce); props `{ courseId, quizId?, onSaved? }` — omit `quizId` to create |
| `/k/[slug]/kelas/[courseSlug]` (silabus tail) | `CourseQuizList` | member-only; renders `<li>` rows into `SyllabusList.footerSlot` |
| `/k/[slug]/kelas/[courseSlug]/kuis/[quizId]` | `QuizTakeView` | member-only (query enforces); props `{ quizId }` |

All routing is prop-injected; the slice hardcodes no URL scheme. `onSaved`
receives the new id after a create and `null` after a delete, so the route can
navigate either way.

## Integration points

1. **Builder entry.** The Kelola › Kuis tab drills kelas → kuis → builder, using
   `useQuizzesForCourse(courseId)` for the middle step. `createQuiz` needs only
   `courseId` — tenant is derived server-side.
2. **Taking entry.** `CourseQuizList` puts every quiz of the course at the end
   of the silabus with the caller's pass state; the row links to
   `/kuis/<quizId>`, which mounts `QuizTakeView`. One list query covers the
   whole course — there is no per-row "has a quiz?" probe.
3. **Progress/badge (optional, out of scope for #8).** If passing a quiz should
   gate lesson/course completion later, that belongs in `slices/progress`; this
   slice exposes `passed` on the attempt result and `listMyAttempts` to build on.

No shared-surface edits were made (no `app/`, no `convex/schema.ts`, no
`STATUS.md`). Schema tables `quizzes` + `quizAttempts` were already deployed.

## Security posture (P0)

- `getQuizForTaking` returns questions projected to `{ prompt, options }` only —
  `correctIndex`/`explanation` are stripped (asserted in `taking.test.ts` by
  inspecting the returned keys and the serialized payload).
- Grading is server-side in `attempts:submitAttempt`; answers/explanations are
  revealed only in that mutation's result.
- Every function calls an authz helper first (auth BEFORE any by-id read — see
  `authz-order.test.ts` dangling-id specs). Draft-course quizzes are invisible to
  plain members (`NOT_FOUND`, no existence leak).
- Builder writes are instructor+ on the COURSE's own tenant; `tenantId`/`courseId`
  are derived from the resolved course, never trusted from the client.

## Tests

`convex/features/quiz/*.test.ts` (convex-test): `authz-order` (dangling-id →
`NOT_AUTHENTICATED`), `builder` (denied paths, `MAX_QUIZZES_PER_COURSE` cap, validation,
delete-blocked-by-attempts), `taking` (answer-stripping shape, draft
invisibility, grading incl. passed boundary, own-attempts-only), `grade`
(pure rounding/boundary). `slices/quiz/__tests__/barrel.test.ts` (barrel
contract + copy + error mapping).
