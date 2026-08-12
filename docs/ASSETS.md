# ASSETS — what the product actually serves

Inventory of `public/`, taken 2026-08-12 against the normalised asset pack. Written because 30 files
were uploaded and only some of them are consumed by any code path; the rest are sitting there, and
the owner deserves to know which is which rather than guessing.

**Headline: 9 of the 30 pack assets are wired. 21 are not.** That is not a failure — icons and
favicons are what an app *can* consume automatically; social banners and brand marks are things a
human uploads somewhere else. The point of this file is that "unused" and "useless" are different,
and each row below says which one it is.

Sizes are bytes on disk after `scripts/optimize-assets.mjs`.

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
| `/ui/404.webp` | 1200×800 | 26 406 | `app/not-found.tsx` `<img>` — **bottom 30% only** (`aspect-[5/1] object-bottom`), so just the skyline band renders and the baked-in raster text above y=524 is cropped out. |
| `/ui/offline.webp` | 1200×800 | 27 970 | `app/offline/page.tsx` `<img>`, same 5:1 bottom crop · `public/sw.js` **PRECACHE + CACHEABLE** (both required — see that file). Verified rendering with the network disabled and the HTTP cache cleared: `naturalWidth` 1200. |
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

**Likeness.** `profiles/avatar-pria-2.webp` and `profiles/avatar-badge.webp` appear to depict a
recognisable public figure. That is an owner decision (rights/likeness) before they ship as
selectable avatars, not an engineering one.

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
| `/ui/empty-courses.webp` | 1200×800 | 4 462 | `components/ui/empty` (`Empty` + `EmptyMedia variant="icon"` + Lucide). Text baked in ("Belum ada kelas"), so the copy could never change per surface. |
| `/ui/empty-results.webp` | 1200×800 | 4 104 | same |
| `/ui/empty-notifications.webp` | 1200×800 | 4 182 | same |
| `/web/hero.webp` | 1920×1080 | 122 068 | **No surface exists.** `/` redirects to `/k/<DEFAULT_COMMUNITY_SLUG>`; there is no marketing landing page with a hero slot. This is the cleanest file in the pack (no ghosting) and the best candidate if a landing page is ever built — or, at 122 KB, as the illustration in a README/press kit today. |
| `/learning/course-cover-template.webp` | 1280×720 | 70 252 | Course cards call `slices/courses/lib/cover-art.ts`, which derives a *different* cover per course from a slug hash — six courses, six covers, ~1.6 KB gzip total, and course #7 gets art with no upload. One shared template would make every course look identical; that is a regression, not a swap. **This file has no home in the product.** Its only defensible use is as a docs/press illustration of what a course card looks like — and it carries the ghosting defect, so fix that first. |
| `/learning/certificate-bg.webp` | 2560×1440 | 22 346 | `slices/profiles/components/certificate-card.tsx` builds the certificate from theme tokens. See §5 — this file is a mock-up with text baked in, not a background. Usable as a docs illustration only. |
| `/profiles/avatar-default.png` | 512² | 2 627 | `ProfileAvatar` falls back to **initials** (`"Rahman Ef" → "RE"`) when `avatarUrl` is empty — no network request, always personal. A shared default image would make every avatar-less member look like the same person. |
| `/profiles/avatar-pria-1.webp` | 512² | 4 806 | `profiles.avatarUrl` is a free-text URL field in Pengaturan; there is no avatar *picker*. A member can paste `/profiles/avatar-pria-1.webp` today and it works. Building a picker is a product decision (and see the likeness note in §5 for two of these files). |
| `/profiles/avatar-pria-2.webp` | 512² | 11 638 | same — **likeness check first** |
| `/profiles/avatar-wanita-1.webp` | 512² | 15 996 | same |
| `/profiles/avatar-berhijab-1.webp` | 512² | 17 352 | same |
| `/profiles/avatar-badge.webp` | 512² | 19 154 | same — **likeness check first** |

---

## 7. Owner's short list

1. Upload `social/github-preview.png` to the repo's social-preview setting.
2. Upload `social/discord-banner.png` in Discord server settings (check the crop).
3. ~~Paste `/social/community-banner.png` into Kelola → cover editor~~ — TESTED AND REJECTED, see §2. Re-export it (§4) and it becomes a one-field change.
4. Re-export the eight ghosted files, `wordmark-light`, and `wordmark-compact` (§5).
5. Decide the likeness question on two avatars (§5).
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
