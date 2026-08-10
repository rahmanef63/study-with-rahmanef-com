# materi — the community's material library, and its prompt library

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

## A skill is a materi

A **skill** is a row of the same table with `kind: "skill"` and its own
`promptText`. Not a new table — which is exactly why it inherited tags, search,
permalinks, backlinks, OG cards, the sitemap and the block editor for free, and
why this one slice serves both libraries.

```
/k/<tenant>/skills                       the prompt library
/k/<tenant>/skills/<lessonSlug>          THE skill page   ← share this one
```

`kind` is **optional** and an absent column means `"materi"` — the same rule
`status` follows, because the pre-migration rows predate both columns. Only a
skill ever writes the column, so the skills library is one exact index range.

**One slug namespace, two routes.** Both permalinks can be handed the other
kind's slug by anyone who copied the wrong path out of a chat, so each one
resolves the row's real `kind` and **307s to the canonical route** instead of
404ing (`buildKindPageHref`). The redirect runs in the page function, not
inside the Suspense boundary — a streamed `redirect()` can only be a
client-side hop, and `generateMetadata` has already paid for the read. A draft
answers `null` on the anonymous query so no redirect fires, and none is needed:
the island reads the row for real either way.

### What differs between the two libraries

|  | `/materi` | `/skills` |
|---|---|---|
| search | narrows the **loaded pages** client-side (`/cari` is the indexed one) | **server query** over title OR prompt text, debounced, top 20 |
| search box | hidden below 8 rows | always shown — it finds rows off-page |
| empty state | one line | explains what a skill is and who adds one |
| detail page | body first | **prompt panel** first, body below it |

Sort (terbaru · terlama · A→Z) is shared. `newest`/`oldest` ride the index;
**A→Z is in-page** — `lessons` has no title index and may not grow one, so a
global alphabet would be an unbounded read. The view says so in a footnote
rather than faking it.

**The prompt is member-only, structurally.** `promptText` is absent from
`PublicMateri`, so the server component and the `opengraph-image` have nothing
to leak; the barrel test asserts the absence at type level and
`queries.test.ts` asserts it key by key. `kind` *is* on the etalase — a
category, which the redirect and the share card both need.

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

// /k/[slug]/materi/[lessonSlug]  (server header first, then the island)
<MateriPageHeader materi={publicMateri} kind="materi" shareUrl tagHref={…} />
<MateriDetailView tenantId tenantSlug lessonSlug hasServerHeading gate={<GabungDulu … />} />

// /k/[slug]/skills
<SkillsLibraryView tenantId tenantSlug initialTag={tag} kelolaHref gate={<GabungDulu … />} />

// /k/[slug]/skills/[lessonSlug]  — the SAME detail view, one prop different
<MateriPageHeader materi={publicSkill} kind="skill" shareUrl tagHref={…} />
<MateriDetailView tenantId tenantSlug lessonSlug kind="skill" hasServerHeading gate={…} />
```

`gate` is a **ReactNode**, not a component this slice imports: the join CTA is
the app's `<GabungDulu/>` and a slice may not reach into `app/`. Everything
else is a string or a number — **no function prop crosses the server→client
boundary**, which is why `tenantSlug` and `kelolaHref` come in raw and every
href is built from `lib/hrefs.ts` on the client side of the line.

`MateriPageHeader` is the one component here that takes a builder (`tagHref`),
and only because it is a **server** component rendered by a server component:
nothing about it crosses the boundary.

## What is server-rendered

Only the **etalase**: `publicGetBySlug` (anonymous whitelist) feeds
`generateMetadata`, the `opengraph-image` and the `<h1>` + tag line on both
permalink pages. It answers `null` for a draft, so the page must **not**
`notFound()` on null — it passes `hasServerHeading={false}` and the island
renders the heading from the member read instead.

Both libraries are 100% client-side and deliberately `robots: { index: false }`:
a list of every materi in a community is exactly what membership buys, and a
catalogue of every prompt is the most copyable thing the product has.

## Not in this slice

Writes. Creating, editing, publishing and placing materi are the Kelola
console's job (`features/courses` → `lessons.*` / `manage.*`); tagging is
`features/materi/tags:setTags`. This slice reads.
