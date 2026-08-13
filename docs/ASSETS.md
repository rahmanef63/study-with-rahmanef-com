# ASSETS — what the product actually serves

Inventory of `public/`. Two drops have landed:

- **2026-08-12 — the install surface.** 30 files: icons, favicons, social cards, brand marks,
  avatars. Normalised by `scripts/optimize-assets.mjs`. Sections 1-8 below.
- **2026-08-13 — the illustration pack.** 91 files that are **76 distinct images** (10 exact
  duplicate pairs, plus five more names colliding on content). Normalised by
  `scripts/normalise-art-pack.mjs`. Section 9 below, which also records what the second drop
  replaced and deleted from the first.

The point of this file is that **"unused" and "useless" are different**, and every row says which
one it is. Sizes are bytes on disk after normalisation.

`npm test` now enforces the top half of this document: `app/__tests__/public-assets.test.ts` scans
every source file for quoted `/…​.webp|png|svg` literals and fails if one does not resolve on disk,
checks `public/sw.js`'s `PRECACHE` list separately, and checks `lib/avatars.ts`. Before it existed
nothing in the repo caught a broken asset path — `npm run pwa:verify` only reads `app/manifest.ts`,
`app/layout.tsx` and the `/icons/…` strings inside `sw.js`.

---

## 1. Wired — the product serves these

| Path | Dim | Bytes | Consumed by |
|---|---|---|---|
| `/icons/icon-16.png` | 16² | 582 | `app/layout.tsx` `<link rel="icon" sizes="16x16">` |
| `/icons/icon-32.png` | 32² | 1 465 | `app/layout.tsx` `<link rel="icon" sizes="32x32">` |
| `/icons/icon-48.png` | 48² | 2 210 | `app/layout.tsx` `<link rel="icon" sizes="48x48">` |
| `/icons/icon-192.png` | 192² | 18 443 | `app/manifest.ts` (icon + all 3 shortcuts) · `app/layout.tsx` · `public/sw.js` precache |
| `/icons/icon-512.png` | 512² | 137 120 | `app/manifest.ts` · `app/layout.tsx` · `sw.js` precache |
| `/icons/icon-maskable-512.png` | 512² | 138 357 | `app/manifest.ts` `purpose: "maskable"` · `sw.js` precache |
| `/icons/apple-touch-icon-180.png` | 180² | 16 146 | `app/manifest.ts` · `app/layout.tsx` `<link rel="apple-touch-icon">` · `sw.js` precache |
| `/web/banner-skyline.webp` | 1600×244 | 11 516 | **Replaced both `/ui/404.webp` and `/ui/offline.webp` on 2026-08-13, and those two files are deleted.** One file, three references: `app/not-found.tsx`, `app/offline/page.tsx`, and `public/sw.js` **PRECACHE + CACHEABLE** (both required — see that file; `VERSION` bumped to `v4`, which is mandatory because the old precached URL now 404s). Text-free at every row, so the `object-bottom` crop that used to hide baked-in raster type is gone. 6.56:1 against a 5:1 box, so `object-cover` trims the sides of a horizon that repeats. |
| `/web/hero-scene.webp` | 1040×1080 | 84 494 | `app/(shell)/page.tsx` `<img fetchPriority="high">` — the landing hero. Capped to `h-44` below `md` (measured: full height put the `<h1>` at y=533 and the second CTA below the fold). |
| `/screenshots/narrow.png` | 412×915 | 41 048 | `app/manifest.ts` `screenshots` (install card). Pre-existing, not from the pack. |
| `/screenshots/wide.png` | 1280×720 | 89 214 | same |
| `/icon.svg` (in `app/`) | vector | 1 397 | Route convention + `app/manifest.ts` last icon. Scales; the PNGs above are for browsers that ignore SVG. |

`npm run pwa:verify` no longer generates these — it verifies that every `src` in `app/manifest.ts`
exists on disk with the declared dimensions. Do not re-point it at a generator.

---

## 2. Not wired — for use OUTSIDE the product

These are correct files with no place in the app because their destination is another product's
settings screen. Nothing to build; someone has to upload them.

| Path | Dim | Bytes | Where it belongs |
|---|---|---|---|
| `/social/github-preview.png` | 1280×640 | 251 974 | **GitHub repo → Settings → General → Social preview.** This is a repository *setting*, not a file the site serves — GitHub stores its own copy. 1280×640 is exactly GitHub's recommended size. Once uploaded, nothing references the file here; keeping it in the repo is only so the source is versioned. |
| `/social/discord-banner.png` | 1920×480 | 437 197 | **Discord → Server Settings → Overview → banner.** Uploaded in Discord, never fetched from us. Its 4:1 crop is wider than Discord's banner slot, so expect a centre crop — check the upload preview before saving. |
| `/social/community-banner.png` | 1920×640 | 524 171 | **Correctly shaped for a tenant cover and NOT usable as one — see §5.** This row previously recommended pasting it into Kelola → cover editor; that advice was written from the inventory, not from the image. Rendered at the slot's real 3.56:1 the ghosted second wordmark dominates the frame. Cropping to the clean left 42% does not rescue it: the ghost still intrudes at the right edge and the tagline cuts mid-word. Two other candidates were tested and rejected too — `web/hero.webp` is clean but 16:9, and its three-line lockup (rows 162–695 of 1080) cannot survive a 540px band at any anchor. **There is no usable community cover in this pack until the ghosted files are re-exported.** The procedural `CourseCover` stays, which is on-brand and costs nothing. It does **not** become the community's social card — `app/k/[slug]/opengraph-image.tsx` deliberately wins over the cover, because that card carries the live member/course counts. |
| `/social/share-card.png` | 1200×630 | 235 871 | No slot. The product's share path is `<TombolBagikan>` → `navigator.share`/clipboard with a URL; the receiving app then unfurls the page's own OG card. This file can only be attached by hand to a manual post. **Re-export before using it** — see §5. |
| `/social/og-default.png` | 1200×630 | 318 619 | Evaluated as the site-wide OG card and rejected. See §4. |
| `/brand/wordmark-horizontal.png` | 1200×400 | 5 344 | README badges, slide decks, press, sponsor listings, anywhere outside the app. See §3. |
| `/brand/wordmark-stacked.png` | 800×1200 | 7 275 | Same — portrait lockup for stories/posters. |
| `/brand/wordmark-compact.png` | 800×400 | 3 891 | Same — **but it is cropped, see §5.** |
| `/brand/wordmark-light.png` | 1200×400 | 3 603 | Intended for light backgrounds — **unusable as shipped, see §5.** |

---

## 3. The in-app mark is the SVG, permanently

`components/brand/logo.tsx` (`Logo` / `LogoMark`) is a procedural SVG drawn with `currentColor`. It
costs ~1 KB, is crisp at 16 px and at 512 px, and re-tints with the theme token wherever it lands.

**The `/brand/*.png` files never go into a component.** A 1200×400 raster is worse than the SVG at
every size the UI actually renders, it cannot follow `currentColor`, and its baked `#071536` field is
not `--background` (`#090f1c`) — dropping one on a page surface shows a visible dark box around the
letters. They are export artefacts for places we do not control the renderer.

Same rule, one level up: `app/icon.svg` is the favicon of record; `/icons/*.png` complement it.

---

## 4. The root OG card: generated, not static — and why

**Recommendation: keep `app/opengraph-image.tsx` generating the card. Implemented (no change to the
code path); this section is the record of the trade.**

What was compared, measured on the committed build:

| | Generated (`lib/og.tsx` → `ogCard`) | Static `/social/og-default.png` |
|---|---|---|
| Bytes per unfurl | **55 689** (`.next/server/app/opengraph-image.body`, 1200×630 PNG) | **318 619** — +262 930 B, 5.7× |
| Render cost at runtime | **zero** — `prerender-manifest.json` lists `/opengraph-image`, so it is rasterised once at build and served as a file | zero |
| Removes the `next/og` dependency? | — | **No.** Eight colocated routes (`/k/[slug]`, `/tentang`, `/kelas/[courseSlug]`, `/materi/[lessonSlug]`, `/skills/[lessonSlug]`, `/post/[postId]`, `/u/[username]`, `/sertifikat/[id]`) render per request through the same helper. Swapping the root buys nothing at the dependency level. |
| Copy | Bahasa Indonesia, matches the product | English — "Learn. Build. Share. Grow.", "Learn Applied AI by Building Real Projects" |
| Name shown | `STUDY-WITH.RAHMANEF.COM` | "STUDY WITH RAHMAN" — not the product's name |
| Editing the tagline | a string in `app/opengraph-image.tsx` | re-export the artwork |
| Consistency | one renderer, nine cards, cannot drift | one route looks unlike the other eight |
| Defects | none | ghosted double-exposure wordmark (§5) |

So the static file loses on every axis that was measurable and on the two that were not (language,
naming). The generated card stays.

The honest counter-argument, recorded rather than buried: `og-default.png` is *illustration* and the
generated card is *typography*, and an illustrated card is more arresting in a crowded feed. If the
owner wants that, the move is **not** to swap the route — it is to fix the source art (drop the ghost
layer, Bahasa copy, correct domain) and pass it into `ogCard` as a background layer, so all nine
cards gain it at once. Note the cost before doing it: satori would embed the image bytes into every
*dynamic* card render, so the illustration must be re-exported small (target < 60 KB) first.

### Two routes still unfurl with no image at all

Measured against the built server (`next start`, `grep 'og:image'` on the response):

| Route | og:image |
|---|---|
| `/komunitas`, `/mulai`, `/roadmap`, `/k/<slug>`, `/k/<slug>/diskusi`, `/pengaturan`, `/notifikasi`, `/offline`, `/` | present |
| **`/changelog`** | ~~none~~ → **fixed 2026-08-12** |
| **`/k/<slug>/kalender`** | ~~none~~ → **fixed 2026-08-12** |

Cause, already documented at three other call sites: a page that exports `openGraph` **without**
`images` suppresses the inherited file-convention card. `app/(shell)/changelog/page.tsx:21` and
`app/k/[slug]/kalender/page.tsx:66` both do this. Fix is one line each — delete the `openGraph` key
(as `/komunitas`, `/mulai`, `/roadmap` and `/diskusi` already did). Both were outside the reporting
agent's ownership; the integrator applied the two deletions.

---

## 5. Defects in the source art — present in the upload, not caused by conversion

Verified by opening each file. Anything below is a re-export request for whoever made the pack, not a
code bug.

**Ghosted double-exposure.** "STUDY WITH RAHMAN" is composited twice at different sizes and offsets:
`social/og-default.png`, `social/share-card.png`, `social/github-preview.png`,
`social/discord-banner.png`, `social/community-banner.png`, `ui/404.webp`, `ui/offline.webp`,
`learning/course-cover-template.webp`. On `share-card.png` the two copies overlap head-on and the
title is illegible; on `github-preview.png` the overlay band collides with the feature list. These
are the public link-unfurl images, so this is the highest-value fix in the pack.

**`brand/wordmark-light.png` is white-on-white.** Background `#f6f7fb`, glyphs `#f7f7f7`. Measured
content bounding box is x∈[432, 696] of 1200 — i.e. only the gold "WITH" renders. Unusable.

**`brand/wordmark-compact.png` is cropped.** Content runs column 0→800 of 800 with no gutter; it
reads "UDY WITH RAHM". (`wordmark-horizontal.png` is fine: content x∈[38, 1162] of 1200.)

**`learning/certificate-bg.webp` is not a background.** It is a finished certificate mock-up with
"CERTIFICATE OF COMPLETION / Presented to / YOUR NAME / for completing a Study With Rahman course"
baked in as pixels, on a cream field. It cannot sit behind `CertificateCard` — the card renders that
same information as real text.

**Likeness — RESOLVED 2026-08-12, owner.** `profiles/avatar-pria-2.webp` and
`profiles/avatar-badge.webp` are pixel-art illustrations inspired by a public figure. The owner
confirms the reference is not IP-encumbered and that the source photograph was released for use.
Cleared to ship. Recorded here so it is raised once and not re-litigated by the next reader —
which is the only reason this paragraph still exists.

---

## 6. Not wired — in-product illustration that the product deliberately does not use

Every file here has a matching surface in the app. The surface renders something else on purpose.
The shared reason, stated once: **these images have their copy baked in as pixels.** Raster text is
not selectable, not translatable, not readable by a screen reader, does not reflow at 390 px, and
does not re-tint with the theme. The existing surfaces render the same sentences as real text.

`ui/404.webp` and `ui/offline.webp` were in this section and are now in §1: the escape hatch is to
crop to the band that holds no type (`aspect-[5/1] object-bottom` + `alt=""`) instead of rendering
the composition whole. Where a file has a clean text-free band, that route is open to it too.

| Path | Dim | Bytes | The surface, and what it does instead |
|---|---|---|---|
| ~~`/ui/empty-courses.webp`~~ | 1200×800 | 4 462 | **DELETED 2026-08-13.** Superseded by `/ui/empty/courses.webp` from the second drop, which is the same subject with no baked text and a real alpha channel. See §9. |
| ~~`/ui/empty-results.webp`~~ | 1200×800 | 4 104 | **DELETED 2026-08-13** → `/ui/empty/results.webp`. |
| ~~`/ui/empty-notifications.webp`~~ | 1200×800 | 4 182 | **DELETED 2026-08-13** → `/ui/empty/notifications.webp`. |
| ~~`/web/hero.webp`~~ | 1920×1080 | 122 068 | **DELETED 2026-08-13.** This row said "no surface exists" and then one was built: `app/(shell)/page.tsx` is a real landing page, and it renders `/web/hero-scene.webp` — the desk-half crop of this file, which drops the baked English prose. The uncropped original is in the 2026-08-12 archive (§8); nothing referenced it. |
| ~~`/learning/course-cover-template.webp`~~ | 1280×720 | 70 252 | **DELETED 2026-08-13**, unreferenced; the second drop's `/learning/cover/module-template.webp` is the same idea, parked for the same reason. Original reasoning: | Course cards call `slices/courses/lib/cover-art.ts`, which derives a *different* cover per course from a slug hash — six courses, six covers, ~1.6 KB gzip total, and course #7 gets art with no upload. One shared template would make every course look identical; that is a regression, not a swap. **This file has no home in the product.** Its only defensible use is as a docs/press illustration of what a course card looks like — and it carries the ghosting defect, so fix that first. |
| `/learning/certificate-bg.webp` | 2560×1440 | 22 346 | `slices/profiles/components/certificate-card.tsx` builds the certificate from theme tokens. See §5 — this file is a mock-up with text baked in, not a background. Usable as a docs illustration only. |
| `/profiles/avatar-default.png` | 512² | 2 627 | `ProfileAvatar` falls back to **initials** (`"Rahman Ef" → "RE"`) when `avatarUrl` is empty — no network request, always personal. A shared default image would make every avatar-less member look like the same person. |
| `/profiles/avatar-pria-1.webp` | 512² | 4 806 | **This row is superseded: the picker was built 2026-08-12** (`slices/profiles/components/avatar-picker.tsx`), and all six are now WIRED, offered as a radiogroup in Pengaturan and validated against the `lib/avatars.ts` allow-list. |
| `/profiles/avatar-pria-2.webp` | 512² | 11 638 | same |
| `/profiles/avatar-wanita-1.webp` | 512² | 15 996 | same |
| `/profiles/avatar-berhijab-1.webp` | 512² | 17 352 | same |
| `/profiles/avatar-badge.webp` | 512² | 19 154 | same |

---

## 7. Owner's short list

1. Upload `social/github-preview.png` to the repo's social-preview setting.
2. Upload `social/discord-banner.png` in Discord server settings (check the crop).
3. ~~Paste `/social/community-banner.png` into Kelola → cover editor~~ — TESTED AND REJECTED, see §2. Re-export it (§4) and it becomes a one-field change.
4. Re-export the eight ghosted files, `wordmark-light`, and `wordmark-compact` (§5).
5. ~~Decide the likeness question on two avatars~~ — cleared by the owner 2026-08-12 (§5).
6. ~~Delete the `openGraph` keys on `/changelog` and `/kalender`~~ — done 2026-08-12.

## 8. Where the pristine originals live

`~/projects/_assets/study-with-rahmanef-com/raw-2026-08-12/` — 35 files, 9,058,585 B, the upload byte
for byte.

OUTSIDE the repo on purpose: committing 9 MB beside the 2.6 MB shipped set would undo the saving that
is the whole point. But the numbered exports were never committed either, and `optimize-assets.mjs`
deletes them from `public/` once converted — so without that archive the only surviving artwork would
have been palettised PNG and lossy WebP. That matters because §5's defects need a RE-EXPORT, not a
re-encode: you cannot un-ghost a wordmark from a compressed copy.

Treat the design-tool source as the real master; this is the fallback if it is lost.

    node scripts/optimize-assets.mjs ~/projects/_assets/study-with-rahmanef-com/raw-2026-08-12

## 9. 1.7 MB in `public/` that nothing fetches — deliberately left there

`social/` and `brand/` are for other people's settings screens (GitHub social preview, Discord banner,
README), so no page requests them, and they ship in the Docker image and are publicly addressable for
nothing.

Moving them to a `docs/press-kit/` was tried and REVERTED. The saving is ~1.7 MB of image size on a VPS
the owner already pays for — no running cost, since the zero-cost law is about paid services — while the
cost is a 404 the day anyone links `/social/og-default.png` expecting it to resolve. A surprise dead
link beats a megabyte of disk. They stay served; this section is why.

---

## 9. The illustration pack — 2026-08-13

91 PNG files landed in `public/general/`, 47 MB, `snake_case` with `NN_` prefixes. They are **76
distinct images**: 10 pairs are byte-identical, and the names are not evidence of content —
`badge_new_learner_alt.png` is byte-identical to `pixel_art_problem_solver_badge.png`, and **the two
badges those names describe are crossed** (the file called new-learner draws PROBLEM SOLVER). Every
output name in `scripts/normalise-art-pack.mjs` was assigned by opening the image.

`node scripts/normalise-art-pack.mjs` converts, files by role, and deletes the drop.
**37 240 788 B → 1 971 600 B, −94.7%.** It refuses to run if the plan and the disk disagree in
either direction, so a file cannot be silently lost when that table is next edited.

### 9.1 The split that decided everything

| group | count | verdict |
|---|---|---|
| numbered sprites `01_`–`32_` | 50 | **USABLE.** No baked text anywhere. |
| `1672×941` / `1536×1024` scenes | 19 | **Mostly parked** — every one bakes a title and the wordmark; four also bake a yellow CTA BUTTON. |
| `1254²` badge medallions | 5 | **Parked** — English text, and a taxonomy the schema does not have. |
| `2746×572` night skyline | 1 | **The best large asset in the drop**, and now the 404 + offline art. |

**The fake-button problem, stated once.** `belum_ada_aktivitas`, `pixel_study_no_results_screen`,
`pixel_study_progress_dashboard` and `pixel_study_community_invitation` are not illustrations. Each
is a finished card: wordmark, heading, body copy, **and a drawn yellow button** ("Mulai Belajar →",
"Ubah Pencarian", "Mulai Kursus", "Jelajahi Komunitas"). Dropped into an `Empty` they would print a
counterfeit button above the real one and repeat the copy the component already writes as text. That
is the `empty-*.webp` failure from the first drop, made worse. They are filed under `/social/post-*`
because a finished Bahasa card with a CTA **is a social post** — a real use, just not this one.

### 9.2 The flood fill, and why it was necessary

21 of the 50 sprites shipped a flat `#010e2e` square instead of an alpha channel. `--background` is
`#090f1c`, so those would land on the page as a visibly bluer rectangle no token can correct — the
**exact** defect recorded in the 35-line refusal at the top of `components/ui/empty.tsx`. Shipping
them unfixed would have repeated a mistake this repo had already written down.

`dekey()` flood-fills from the border inward at a squared-distance tolerance of 28. **Contiguity is
the safety property**: the artwork reuses the field navy inside itself (the night sky behind a
telescope, the glass of a magnifier lens), so a global colour replace would punch holes straight
through it; a fill seeded only from border pixels can reach the field and nothing else.

The tolerance was measured, not guessed. At 28 the six worst cases lose 54–88% of canvas, all field,
with sparkles, embers and drop shadows intact. At 48 it starts eating art: the campfire loses its
logs, the chat group loses its base shadow, the book loses the edge of its ribbon. Verified by
rendering the output on `#090f1c` — no residual box on any of the 16 checked.

### 9.3 Wired

| Path | Surface |
|---|---|
| `/web/banner-skyline.webp` | `app/not-found.tsx` · `app/offline/page.tsx` · `sw.js` PRECACHE+CACHEABLE. Replaced `ui/404.webp` and `ui/offline.webp`; both deleted; `VERSION` → `v4`. |
| `/ui/empty/discovery.webp` | `app/(shell)/page.tsx` — "Tiga cara mulai" card 1 (→ `/mulai`). Was a 20px lucide `Compass`. **Not `telescope.webp`** — an earlier draft of this row said so and was wrong; telescope and map both keep a gradient sky that survives the flood fill and shows as a box on `bg-card`. |
| `/ui/spot/roadmap-path.webp` | same section, card 2 (→ `/roadmap`). Was `Map`. |
| `/ui/empty/diskusi.webp` | same section, card 3 (→ Diskusi). Was `MessagesSquare`. |
| `/ui/status/waiting.webp` | `app/(shell)/komunitas/page.tsx` — "Belum ada komunitas aktif". An hourglass is what "sedang dikurasi" means. |
| `/ui/empty/kalender.webp` | `app/k/[slug]/kalender/page.tsx` — "Belum ada sesi terjadwal". |
| `/learning/badge/trophy.webp` | `app/k/[slug]/peringkat/…/papan-skor.tsx` — "Belum ada skor". |

`EmptyArt` (in `components/ui/empty.tsx`) is the shared seam. It renders into `variant="default"`,
which already centres an unconstrained child — **no `illustration` variant had to be invented**, and
the refusal comment above it stands as the test the next drop has to pass.

### 9.4 Parked, and the honest reason

- **`/learning/cover/*` (11 files).** 1200×675, i.e. **16:9 — not the `aspect-[2/1]` the cover slot uses**, which an earlier draft of this row got wrong. Each
  bakes an ENGLISH title — "AI BASICS", "DATA ANALYSIS", "MACHINE LEARNING", "WEB DEVELOPMENT" —
  onto a product whose courses are titled in Bahasa, beside the wordmark the rail already carries.
  Two further problems even if that were acceptable: only 4 of the 13 published courses have a
  matching cover (`machine-learning` matches nothing — there is no ML course), so wiring them
  leaves a catalogue that is a third raster and two thirds procedural; and a course cover must be an
  **absolute `https://` URL** (`convex/features/courses/validate.ts` `assertCoverImageUrl`, plus a
  `type="url"` input in the Kelola form), so a relative path cannot be stored without a validator
  change and a Convex deploy. The procedural `CourseCover` stays — consistent across all 13, zero
  bytes, and course #14 gets art with no upload.
- **`/learning/medal/*` (5 files).** English text, plus they name an achievement taxonomy
  (explorer / builder / problem solver / new learner / AI enthusiast) that **no table, mutation or
  seed in this repo has**. A badge here is a completed course — `courseCompletions`, whose schema
  comment says `// = badge` — keyed by `courseSlug`. Wiring these is a data-model change, not a
  wiring job. Filenames are corrected against the artwork; do not trust the drop's own names.
- **`/social/post-*` (5) and `/social/mockup-dashboard.webp`.** See §9.1. `mockup-dashboard` is a
  picture of a loading skeleton, which no screen can legitimately show.
- **`/ui/spot/*` and `/ui/empty/*` not listed in §9.3.** Correct, converted and de-keyed, waiting
  for a surface. Named by role so the next person can grep for one instead of opening 40 files.

### 9.5 Where the originals live

`~/projects/_assets/study-with-rahmanef-com/raw-2026-08-13-general/` — 86 files, 47 MB, byte for
byte. Outside the repo for the same reason as §8, and load-bearing for the same one: the parked files
above need a **re-export**, and you cannot un-bake English text from a compressed copy.

---

## 10. Second pass — 2026-08-14

### 10.1 A third drop landed in `public/temp/` and none of it is new

8 ChatGPT PNGs, 9.5 MB — 3.6× the entire committed `public/` tree. Opened, all eight:

| what | why it is parked |
|---|---|
| "Belum ada aktivitas", "Tidak ada hasil" | Finished cards. Better than the last batch — **no drawn button this time** — but the heading, the body copy and the wordmark are still pixels. Cropping to the art leaves an old man at a desk and a man with a magnifier: `/ui/spot/mentor.webp` and `/ui/empty/results.webp`, which this repo already ships de-keyed at a fortieth of the bytes. |
| "DATA ANALYSIS", "QUIZ / Uji pemahamanmu" | English titles baked in, on a Bahasa product. §9.4. |
| COMMUNITY CONTRIBUTOR, a certificate seal | English, and a taxonomy no table has. §9.4. |
| "Install Sekarang", "Update Sekarang" (portrait) | Bahasa — and both **draw a yellow button**. There is also no install prompt to host them: `grep beforeinstallprompt` across `app/ components/ slices/ lib/` returns nothing, and `components/pwa/` holds one file. |

Archived to `~/projects/_assets/study-with-rahmanef-com/raw-2026-08-14-temp/`, deleted from the repo.

**The pattern is now three drops old, so it is worth stating as a rule rather than a finding: what this
product cannot use is a finished CARD; what it always uses is a text-free CUTOUT.** Every asset wired
in §9.3 is a subject on transparency. Every asset parked in §9.4 and here is a composition with words
in it. The generator prompt is the fix, not the pipeline.

### 10.2 PNGs — what went, and the four refusals

Deleted (zero code referrers, all documented defective or superseded): `social/{og-default,
github-preview,discord-banner,community-banner}.png` (deleted by the owner, staged here),
`social/share-card.png`, `brand/wordmark-light.png` (white-on-white), `brand/wordmark-compact.png`
(cropped to "UDY WITH RAHM"), and the whole of `public/temp/`. Their ordinals were removed from
`scripts/optimize-assets.mjs` so the next drop cannot regenerate them.

Kept: `brand/wordmark-horizontal.png` (a live `<img>` in README.md), `brand/wordmark-stacked.png`.

**Four refusals. These are regressions, not tidiness:**

| PNG | The standard that forces it |
|---|---|
| `icons/apple-touch-icon-180.png` | Safari does not accept a WebP `apple-touch-icon`, and `app/layout.tsx` declares no `type` to negotiate with. |
| `icons/icon-192 / -512 / -maskable-512.png` | `scripts/verifyInstallSurface.mjs` skips any non-`.png` URL, so converting silently disables both the dimension check AND the maskable safe-zone guard — the guard that exists because that exact bug shipped once. All three are also `sw.js` PRECACHE entries, so a rename 404s the precache of every installed user unless `VERSION` is bumped again. Saving: ~4 KB. |
| `screenshots/{narrow,wide}.png` | Playwright's `page.screenshot()` emits `png` or `jpeg` only, so `scripts/generateScreenshots.mjs` cannot regenerate a WebP — and it reads the PNG IHDR header raw to assert the size, which is meaningless in a RIFF container. |
| `profiles/avatar-default.png` | **A stored database value.** It is in the `lib/avatars.ts` allow-list, which is compiled into the Convex deployment and enforced by exact match in `updateProfile`. Renaming it dead-images any member who picked "Siluet netral" and makes their next save fail `VALIDATION_FAILED`. *Measured before writing this: 8 prod profiles, 5 on Google URLs and 3 empty, so nobody holds it today — the file survives on the rule, not on luck.* |

### 10.3 The "dynamic config" ask, answered honestly

Asked for: a dynamic file with **font, size and colour** as its knobs. Two of the three already have
one, and it is not a new file.

- **Font and colour → `app/globals.css`.** The Tailwind v4 `@theme` block holds `--font-sans`,
  `--font-display`, the whole type scale and every colour. There is no `tailwind.config.*` in this
  repo and `components.json` pins `"config": ""`, so that block is not one source of truth among
  several — it is the only one. Restating any of it in TypeScript recreates `slices/theme-presets`,
  1 154 LOC of runtime colour/radius/font config that was **deleted on 2026-08-09** (DECISIONS #26).
- **Size → `lib/art.ts`, new.** This one genuinely had no home: illustration box sizes are
  `<img width>` integers, not type-scale steps, and they were four magic numbers in four files with
  no stated relationship. `ART_SIZE` now names all four and says what each is for.
- **Art paths → a field on `lib/peta/paths.ts`, not a registry.** `PATHS` was already the SSOT for
  the eight learning paths and is imported by *both* surfaces that needed art (`/roadmap` and the
  `/mulai` result card), so `art: string` on `PathPlan` is the whole config. Every other surface —
  `/masuk`, `/changelog`, `error.tsx`, each empty state — has exactly one caller, so a shared
  registry would be an abstraction with one consumer per key; those keep a literal in the file that
  renders them, as the landing already does.

Never build an art path with a template literal: `app/__tests__/public-assets.test.ts` matches
quoted paths only, so a computed one is never checked for existence.

### 10.4 Newly wired

`/ui/empty/courses` · `/ui/status/waiting` · `/ui/spot/code-document` · `/ui/empty/statistik` ·
`/ui/spot/web-design` · `/ui/spot/ai-brain` · `/ui/spot/mobile-rocket` · `/ui/spot/graduation` — one
per learning path, rendered on `/roadmap` and on the `/mulai` result card.

`/ui/empty/anggota` (`/masuk`) · `/ui/spot/blueprint` (`/changelog`) · `/web/banner-skyline`
(`app/error.tsx`, reusing the precached 404 strip) · `/ui/empty/search` (search) ·
`/ui/empty/generic` (Skills) · `/learning/badge/achievement` (badge wall) · `/ui/empty/diskusi`
(the feed).

`/learning/cover/roadmap-trail.webp` — **the one cover with a home.** Cropped from x=0.50 of the
archived original (measured: the baked title's tallest glyph stroke ends at column 829 of 1672 =
0.496), leaving a night-mountain quest trail whose five station labels are already Bahasa. Rendered
`hidden md:block` beside the `/roadmap` header, so a phone pays nothing for it.

Every sprite was rendered on `#0f1626` — `--card`, which is *lighter* than `--background` — before
being wired. `telescope`, `map`, `exploration` and `student` all failed that check: their skies are
gradients, so the border-seeded flood fill stops partway and leaves a visible box. Do the same before
swapping one.

### 10.5 Still parked, still for one reason

10 of the 11 covers, all 5 medallions, the 6 `social/post-*` cards, `learning/certificate-bg.webp`,
and `/ui/status/{install,notification,offline,offline-mobile,not-found}.webp` — the last five because
their surfaces already render `/web/banner-skyline.webp`, and because building a PWA install prompt
to justify a 14 KB file is a feature, not a wiring job.
