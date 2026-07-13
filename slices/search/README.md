# search — pencarian kelas & materi per komunitas (#23)

Member-only full-text search inside one tenant: published course titles
(`courses.search_title`) + lesson content (`lessons.search_content`), with a
draft-guard so lessons of non-published courses never surface.

## Mounting (alpha)

```tsx
import { SearchView } from "@/features/search";

<SearchView
  tenantId={tenant._id}
  tenantSlug={tenant.slug}
  onNavigate={(href) => openApp(href)} // os-shell openApp seam
/>
```

Without `onNavigate`, result clicks fall back to `next/link` navigation —
deep-link URLs (`/kelas/<tenant>/<course>` and
`/kelas/<tenant>/<course>/lesson/<lessonId>`) still open windows via URL-sync.

## Convex surface

`api.features.search.queries.searchInTenant({ tenantId, q })` — requireTenantRole(member)
first; `q` trimmed then 2–60 chars; bounded (10 courses + 15 lessons); returns flat
safe projections `{ kind: "course" | "lesson", title, courseSlug, lessonId?, snippet? }`.

## Security invariants (tested)

Anon → `NOT_AUTHENTICATED` before any read; outsider/other-tenant member →
`NOT_AUTHORIZED`; drafts and archived-course lessons never returned; exact
projection keys asserted (no raw `contentMd`, no `tenantId`, no status).
