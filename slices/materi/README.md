# materi — the community's material library

`@/features/materi` · frontend-only slice over `convex/features/materi`.

## The model in one paragraph

A **materi** is TENANT-level content (DECISIONS #36/#37). It has a slug, a
status and an author of its own, and it lives at a canonical URL:

```
/k/<tenant>/materi                       the library
/k/<tenant>/materi/<lessonSlug>          THE materi page  ← share this one
/k/<tenant>/kelas/<courseSlug>/<lessonId> the same materi read inside a course
```

A course is **one ordered arrangement** of materi (`courseLessons`), not their
owner. The same sheet can be week 3 of one course and week 1 of another — which
is what the "Muncul di kelas" panel under the body shows.

## Visibility (mirrored from `convex/features/materi/access.ts`)

| viewer | published materi | draft materi | body |
|---|---|---|---|
| anonymous | etalase only (title, tags, published courses) | invisible | never |
| member | yes | `NOT_FOUND` | yes |
| instructor+ | yes | yes | yes |

A **course's** draft status gates the course page only. It never hides the
materi — that separation is the point of the model. What it does gate is
whether that course is *named* in "Muncul di kelas" below instructor level.

## Mounts

```tsx
// /k/[slug]/materi
<MateriLibraryView tenantId tenantSlug initialTag={tag} gate={<GabungDulu … />} />

// /k/[slug]/materi/[lessonSlug]
<MateriDetailView tenantId tenantSlug lessonSlug hasServerHeading gate={<GabungDulu … />} />
```

`gate` is a **ReactNode**, not a component this slice imports: the join CTA is
the app's `<GabungDulu/>` and a slice may not reach into `app/`. Everything
else is a string or a number — **no function prop crosses the server→client
boundary**, which is why `tenantSlug` comes in raw and every href is built from
`lib/hrefs.ts` on the client side of the line.

## What is server-rendered

Only the **etalase**: `publicGetBySlug` (anonymous whitelist) feeds
`generateMetadata`, the `opengraph-image` and the `<h1>` + tag line on the
materi page. It answers `null` for a draft, so the page must **not**
`notFound()` on null — it passes `hasServerHeading={false}` and the island
renders the heading from the member read instead.

The library is 100% client-side and deliberately `robots: { index: false }`: a
list of every materi in a community is exactly what membership buys.

## Not in this slice

Writes. Creating, editing, publishing and placing materi are the Kelola
console's job (`features/courses` → `lessons.*` / `manage.*`); tagging is
`features/materi/tags:setTags`. This slice reads.
