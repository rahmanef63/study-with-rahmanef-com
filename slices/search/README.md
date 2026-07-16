# search — pencarian kelas, materi & sumber per komunitas (#23, #29)

Member-only full-text search inside one tenant: published course titles
(`courses.search_title`) + lesson content (`lessons.search_content`), with a
draft-guard so lessons of non-published courses never surface. Since 0.2.0
(#29) also the resource board: APPROVED resources by title (index
`by_tenant_status`, in-memory filter — no new search index).

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
**Resource hits are the exception:** they are EXTERNAL urls rendered as
`<a target="_blank" rel="noopener noreferrer">` and never routed through
`onNavigate`/openApp.

## Convex surface

`api.features.search.queries.searchInTenant({ tenantId, q })` — requireTenantRole(member)
first; `q` trimmed then 2–60 chars; bounded (10 courses + 15 lessons + 10 resources
from a take(50) approved scan); returns flat safe projections
`{ kind: "course" | "lesson", title, courseSlug, lessonId?, snippet? }` and
`{ kind: "resource", title, url }`.

## Security invariants (tested)

Anon → `NOT_AUTHENTICATED` before any read; outsider/other-tenant member →
`NOT_AUTHORIZED`; drafts and archived-course lessons never returned; pending and
rejected resources never returned (approved filtered structurally in the index);
exact projection keys asserted (no raw `contentMd`, no `tenantId`, no status, no
resource `note`/`submittedBy`/id).
