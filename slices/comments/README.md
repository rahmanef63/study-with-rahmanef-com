# comments — diskusi per lesson (#16, fase-2)

> Frontend host = OS desktop shell (pivot 2026-07-07): view ini di-mount alpha di
> window-app lesson, bukan route group lama. Backend Convex tidak berubah oleh pivot.

Per-lesson discussion for members of the lesson's tenant: root comments +
**depth-1 replies** (reply-to-reply is rejected server-side), **soft delete**
(author or instructor+) that projects a placeholder — the deleted body never
leaves the server again.

## Mount (integrator)

```tsx
import { LessonComments } from "@/features/comments";

<LessonComments lessonId={lesson._id} />
```

Self-contained: reads (`listByLesson`, includes the viewer's `canModerate`
flag), writes, toasts, and the delete confirm (ResponsiveDialog) are internal.
Optional `copy` override + `className` for spacing inside the window.

## Convex surface (`api.features.comments.*`)

| Fn | Role | Notes |
|---|---|---|
| `comments:addComment` | member+ of the lesson's tenant | bodyMd 1–2000 (trim); `parentId` must be a ROOT of the SAME lesson, not deleted; RATE_LIMITED at the per-lesson cap; draft/archived-course lessons = instructor+ |
| `comments:softDelete` | author OR instructor+ | sets `deletedAt`; idempotent; never hard-deletes |
| `queries:listByLesson` | member+ (same gate as add) | newest-first, bounded `take(200)`; deleted → `{deleted:true,bodyMd:null,author:null}`; author = public-profile fields only |

P0s honored: validators on every fn, authz-first + auth-before-read (no
existence oracle — see `authz-order.test.ts`), tenantId from the lesson row,
indexed bounded reads only, `ConvexError({code,message})` typed codes.

## Tests

`convex/features/comments/*.test.ts` — denied paths (anon / outsider /
cross-tenant / wrong role), depth-1 rejection, deleted-parent rejection,
anti-spam cap, soft-delete placeholder + body-leak assertion, authz-order
dangling-id regressions. Slice: `__tests__/` barrel contract + metadata sync,
`buildThread`, `formatRelativeTime`.
