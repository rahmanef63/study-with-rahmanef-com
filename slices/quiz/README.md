# quiz — MCQ builder + attempt + auto-grade

STATUS row **#8** (v1.1, R6). Backend: `convex/features/quiz/`. Agent: gamma.

One quiz per module. Instructors build it (MCQ, 2–6 options, one correct key,
optional explanation, passing score %); members take it; grading is
**server-side**. The correct answers and explanations **never** reach the client
before an attempt is submitted (P0).

## Mount points (integrator)

| Route (suggested) | Export | Notes |
|---|---|---|
| `/t/[slug]/kelola/kelas/[courseId]/modul/[moduleId]/kuis` | `QuizBuilderView` | instructor+ (query/mutation enforce); props `{ moduleId, courseId, tenantId, onDeleted? }` |
| `…/belajar/[lessonId]` (or a module tab) | `QuizTakeView` | member-only (query enforces); props `{ moduleId }` |

All routing is prop-injected; the slice hardcodes no URL scheme. `onDeleted` lets
the route redirect after a quiz is deleted.

## Integration points for alpha (I did NOT edit the course editor)

1. **Builder entry.** Add an entry point from the course editor / module row to
   `QuizBuilderView({ moduleId, courseId, tenantId })`. The three ids are already
   in the editor's tree data (`convex/features/courses/manage:getCourseTree`).
   `createQuiz` only needs `moduleId` — course + tenant are derived server-side.
2. **Taking entry.** Surface `QuizTakeView({ moduleId })` on the member module/
   lesson page. To show a "has quiz" affordance in the syllabus, either call
   `api.features.quiz.taking.getQuizForTaking` per module, or (cheaper) I can add
   a `hasQuizByModuleIds` batch query in a follow-up — flagged as a proposal.
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
- Builder writes are instructor+ on the module's own tenant; `tenantId`/`courseId`
  are derived from the module, never trusted from the client.

## Tests

`convex/features/quiz/*.test.ts` (convex-test): `authz-order` (dangling-id →
`NOT_AUTHENTICATED`), `builder` (denied paths, one-per-module, validation,
delete-blocked-by-attempts), `taking` (answer-stripping shape, draft
invisibility, grading incl. passed boundary, own-attempts-only), `grade`
(pure rounding/boundary). `slices/quiz/__tests__/barrel.test.ts` (barrel
contract + copy + error mapping).
