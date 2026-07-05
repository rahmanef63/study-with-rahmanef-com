# Rencana Vertical Slice

> Konvensi rr berlaku penuh: `slices/<slug>/` + `convex/features/<slug>/`, metadata pair, barrel-only imports, ≤200 LOC/file, props-driven.
> **Copy-first (P1):** katalog rr = https://resource.rahmanef.com (69 slices; JSON: `/api/knowledge`; prompt per-slice: `/agents/<slug>`). Pemetaan kebutuhan→slice yang sudah diverifikasi ada di [AGENTS.md](../AGENTS.md) §3 — `convex-auth`, `dashboard-shell`, `marketing-chrome`, `library`, `rate-limit`, dll. Copy + sanitasi, jangan greenfield. Jika sumber tidak tersedia: STOP dan tanya.

## Daftar slice

| Slice | Rilis | Tanggung jawab | Tabel Convex | Route utama |
|---|---|---|---|---|
| `tenants` | v1 (form request + approval UI → v1.1) | profil komunitas, join, membership + role, approval | tenants, memberships | `/t/[slug]`, `/t/[slug]/kelola/komunitas`, `/admin/komunitas` |
| `courses` | v1 | CRUD kelas/modul/lesson; viewer lesson (YouTube + markdown + links) | courses, modules, lessons | `/t/[slug]/kelas/[kelasSlug]`, `…/belajar/[lessonId]`, `/t/[slug]/kelola/kelas` |
| `progress` | v1 | tandai selesai, progress bar, penyelesaian kelas | lessonCompletions, courseCompletions | (embed di halaman courses) |
| `profiles` | v1 minimal · publik + badge v1.1 | profil user, username, badge wall | profiles | `/u/[username]`, `/pengaturan/profil` |
| `resources` | v1.1 | resource board + suggestion box (submit → kurasi) | resources, suggestions | `/t/[slug]/resources`, `/t/[slug]/usulan` |
| `quiz` | v1.1 | builder MCQ, pengerjaan, auto-grade | quizzes, quizAttempts | (embed di modul) + `/t/[slug]/kelola/quiz` |
| `announcements` | v1.1 | pengumuman in-app + internal action Discord webhook | announcements | `/t/[slug]/pengumuman` |

Setiap slice: `components/ lib/ utils/ hooks/ config/ api/` + `types.ts` + tests + `slice.json` (dengan blok `contract`) + `slice.manifest.json` (versi sinkron).

## App-level (bukan slice)

- `app/(public)/` — landing, `/login`, `/u/[username]` (konsumsi barrel `profiles`).
- `app/t/[slug]/` — shell komunitas: dashboard-shell rr, full-bleed `h-dvh`, satu chrome.
- `app/admin/` — platform admin (konsumsi api slice `tenants`), mount di dalam shell.
- `proxy.ts` (bukan middleware.ts), theme tokens, `convex/_shared/auth.ts`, `convex/schema.ts` (komposisi dari DATA-MODEL.md).

## Peta route & guard

| Route | Halaman | Guard |
|---|---|---|
| `/` | landing: penjelasan + etalase komunitas & kelas aktif | publik |
| `/login` | Google OAuth | publik |
| `/u/[username]` | profil publik + badge | publik |
| `/t/[slug]` | beranda komunitas (deskripsi, daftar kelas, link Discord) | publik (etalase); tombol join untuk yang login |
| `/t/[slug]/kelas/[kelasSlug]` | overview kelas + silabus | publik (judul/silabus); konten butuh join |
| `/t/[slug]/kelas/[kelasSlug]/belajar/[lessonId]` | lesson player (YouTube + markdown + links + tombol selesai) | member |
| `/t/[slug]/resources`, `/usulan`, `/pengumuman` | papan komunitas | member (submit); pending: instructor+ |
| `/t/[slug]/kelola/**` | dashboard instructor/owner | instructor+ (komunitas: owner) |
| `/admin/**` | approval komunitas, daftar tenant | platform admin |

Guard route = UX saja; keamanan sesungguhnya di authz Convex per function (P0, lihat DATA-MODEL.md).

## Data fetching (pola per halaman)

- Halaman authed/dinamis: server component `preloadQuery` → client `usePreloadedQuery` (reaktif, tanpa loading flash).
- Landing (statis): `"use cache"` + `fetchQuery` daftar komunitas aktif.
- Mutation: hooks slice-lokal (`slices/<slug>/hooks/`), error `ConvexError.code` → copy user-facing via toast (sonner).
- **Tidak ada fetch di `useEffect`.**

## Urutan build

| Langkah | Isi | Rilis |
|---|---|---|
| 0 | Scaffold copy-first: Next 16 + Tailwind v4 + Convex self-host dev + @convex-dev/auth (Google) + shadcn + shell + proxy.ts | — |
| 1 | Slice `tenants` (skema penuh + seed komunitas pertama; tanpa form request) | v1 |
| 2 | Slice `courses` | v1 |
| 3 | Slice `progress` + `profiles` minimal | v1 |
| 4 | Landing + polish + e2e smoke → **LAUNCH v1** | v1 |
| 5 | `tenants` request-form + `/admin` approval | v1.1 |
| 6 | Slice `resources` (board + usulan) | v1.1 |
| 7 | Slice `quiz` | v1.1 |
| 8 | `profiles` publik + badge wall | v1.1 |
| 9 | Slice `announcements` (+ webhook action) | v1.1 |

## Definition of done — per slice

- `npx tsc --noEmit` hijau.
- `convex-test`: setiap mutation/query diuji, **termasuk jalur authz-denied** (caller tanpa auth/role ditolak) — P0.
- Test barrel API (kontrak yang dipakai konsumen).
- Metadata pair versi sinkron (`audit:slices`); tak ada file >200 LOC (`audit:file-size`).
- Tidak ada import lintas-slice selain via barrel; tidak ada hardcode URL/copy (props-driven).

## Pra-launch v1 (app-level)

- Playwright smoke: login → join komunitas → buka lesson → tandai selesai → progress naik.
- `error.tsx` + `not-found.tsx` di tiap route group.
- Cek `check:stack-pin`; commit conventional; risky change → staging dulu (`git push origin main:staging` → `e2e:staging` → main).
