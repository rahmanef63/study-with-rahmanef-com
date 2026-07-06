# UI/UX PRD — belajar-with-rahmanef.com (study-with.rahmanef.com)

> v1.0 · 2026-07-06 · Pemilik: alpha (integrator) · Eksekutor: agent **ui** (design exploration) + slice owners
> Fokus dokumen: DAFTAR FITUR & PERMUKAAN — arah visual di sini adalah brief, bukan desain final; eksplorasi desain adalah tugas agent ui.
> Konteks produk: [PRD.md](PRD.md) · kontrak: [AGENTS.md](../AGENTS.md) · aturan UI rr: [rr-conventions.md](rr-conventions.md) §UI

## 1. Arah visual — "Akademik & Tenang"

Prinsip (referensi rasa: Notion, Coursera, jurnal digital yang enak dibaca):

1. **Keterbacaan di atas segalanya.** Konten pelajaran = produk. Prose max-width ±68ch, line-height lega (1.7 untuk body), ukuran font nyaman (16–18px body).
2. **Tipografi berkarakter akademik.** Judul/display pakai serif (eksplorasi: Lora / Source Serif 4 / Newsreader via next/font), body tetap sans (Inter sudah terpasang). Hirarki jelas lewat ukuran & spacing, bukan warna-warni.
3. **Palet netral hangat + SATU aksen tenang.** Netral warm-gray/stone; aksen kandidat: hijau tua, indigo redup, atau burgundy — eksplorasi via theme-presets (±30 preset tweakcn sudah bundled; pilih preset, jangan hardcode hex — tones SSOT).
4. **Default LIGHT mode.** Nuansa akademik terbaca lebih baik terang; dark tetap tersedia via switcher. (Saat ini default system → layar Rahman jatuh gelap; ubah `ThemeProviders defaultMode="light"` + preset default via `SaveSiteDefaultButton`.)
5. **Dekorasi minim, motion halus.** Micro-interaction seperlunya (rr `motion-kit`: reveal/stagger — reduced-motion safe); tanpa glow/gradient ramai. Foto/ilustrasi: warm, manusiawi, konsisten (hero sudah ada — audit ulang tone-nya di light mode).
6. **Copy Bahasa Indonesia yang tenang & memandu** — kalimat pendek, tanpa hype; istilah teknis tetap EN (kontrak §7).

Anti-goals visual: neon/glassmorphism, gradient mencolok, animasi besar, kepadatan dashboard ala trading app.

## 2. Aturan teknis yang MENGIKAT eksplorasi

- shadcn primitives only · theme tokens only (`bg-background` dst., tones SSOT) · mobile-first · exactly one chrome per surface (marketing chrome vs tenant shell) · `feedback-states` slice untuk skeleton/empty/error · copy via props `labels` (default ID).
- Slice frontend files kebab-case; JANGAN menyentuh `convex/**` (dan ingat: modul convex camelCase — bukan urusan UI).
- Kepemilikan: komponen di `slices/<slug>/**` milik slice owner; `app/**`, theme, tokens, font milik alpha. Agent ui menghasilkan SPEC + token proposal + (opsional) mockup; implementasi shared surfaces via alpha, komponen slice via prompt per-slice.

## 3. P0 — WIRING GAPS (fungsional; kerjakan SEBELUM estetika)

| # | Gap | Dampak | Perbaikan |
|---|---|---|---|
| G1 | `useEnsureProfileOnFirstLogin` tidak pernah dipanggil di app | User baru login TANPA baris profil → /u/[username], settings, badge rusak untuk mereka | Panggil di client boot (mis. komponen kecil di root layout di dalam ConvexClientProvider) |
| G2 | Tidak ada tombol **logout** / user menu di mana pun | User terjebak login; tak ada akses cepat ke profil/pengaturan | User menu di header (avatar → Profil publik, Pengaturan profil, Komunitas saya, Keluar) — pakai `signOut` @convex-dev/auth |
| G3 | `/pengaturan/profil` tidak ter-mount (ProfileSettingsView yatim) | User tak bisa ganti username/nama/bio/avatar | Mount route + link dari user menu |
| G4 | `/t/[slug]/kelola/komunitas` tidak ter-mount (TenantSettingsView yatim) | Owner tak bisa edit profil komunitas, link invite & **webhook Discord** → fitur pengumuman-ke-Discord tak bisa dipakai end-to-end | Mount route + link "Pengaturan" di tenant shell utk owner |
| G5 | Default theme = system (gelap di banyak device) | Bertentangan arah akademik-terang | `defaultMode="light"` + pilih preset default |
| G6 | Header marketing menampilkan nama user tapi bukan menu | Dead-end UX | Jadikan trigger user menu (G2) |

## 4. Inventaris permukaan (kondisi nyata per 2026-07-06)

Legenda kondisi: 🟢 layak · 🟡 fungsional tapi gersang · 🔴 skeleton/placeholder

### Publik (chrome: marketing header+footer)
| Route | Audiens | Kondisi | Kebutuhan UX (fitur) |
|---|---|---|---|
| `/` landing | pengunjung | 🟡 hero+etalase ada | Etalase kelas nyata (kartu kelas per komunitas, bukan placeholder); section "cara kerja 3 langkah"; social proof/testimoni (fase 2); CTA ganda (belajar / buka komunitas); footer link lengkap (tentang, GitHub, Discord); OG image + favicon + metadata per halaman |
| `/login` | pengunjung | 🟡 | Halaman split dengan value-prop singkat; state error ramah; redirect balik ke halaman asal (returnTo) |
| `/buka-komunitas` | user login | 🟡 form polos | Penjelasan alur (ajukan → ditinjau → tayang); status pengajuanku (pending banner); ilustrasi tenang |
| `/u/[username]` | publik | 🟡 | Kartu profil rapi + badge wall grid; OG card share; empty state badge yang memotivasi |

### Belajar — member (chrome: tenant shell)
| Route | Kondisi | Kebutuhan UX (fitur) |
|---|---|---|
| `/t/[slug]` home | 🟡 sangat gersang | Header komunitas kaya (cover/warna track, deskripsi, tombol Discord, member count); grid kartu kelas dengan progress ring utk member; CTA join menonjol utk non-member; pengumuman terbaru ringkas; empty state "kelas pertama sedang disiapkan" yang hangat |
| `/t/[slug]/kelas/[kelasSlug]` | 🟡 | Silabus dengan ceklis progress per lesson (sudah wired) — poles hirarki modul, durasi/jumlah lesson, tombol "Lanjut belajar" ke lesson terakhir; quiz entry per modul (taking) |
| `.../belajar/[lessonId]` player | 🟡 | Layout fokus-baca (video sticky di atas pada mobile, prose nyaman); nav prev/next jelas; tombol selesai sticky; daftar link resource rapi; sidebar silabus (desktop) |
| `/t/[slug]/resources` | 🟡 | Grid kartu dengan favicon domain; tab pending utk kurator; empty state ajakan submit |
| `/t/[slug]/usulan` | 🟡 | Daftar usulan + status chips (open/planned/done); form ringan |
| `/t/[slug]/pengumuman` | 🟡 | Kartu pengumuman dengan tanggal relatif; badge "terkirim ke Discord" |
| Tenant shell (layout) | 🔴 minimal | Nav tab dengan active state; identitas komunitas di header; user menu (G2); tombol "Kelola" kontekstual utk instructor+; mobile: nav jadi scrollable tabs/dock |

### Kelola — instructor/owner (chrome: tenant shell)
| Route | Kondisi | Kebutuhan UX (fitur) |
|---|---|---|
| `/t/[slug]/kelola/kelas` | 🟡 | Tabel/kartu kelas + status chips draft/published; empty state tuntun buat kelas pertama |
| `.../kelola/kelas/[courseId]` editor | 🟡 | Tree editor: hirarki modul→lesson lebih terbaca, drag handle (fase 2), preview markdown, indikator quiz per modul (link builder sudah ada) |
| `.../quiz/[moduleId]` builder | 🟡 | Editor soal dengan kartu per pertanyaan; validasi inline; preview mode member |
| `/t/[slug]/kelola/komunitas` | ❌ G4 | Form profil komunitas + Discord (invite + webhook write-only) + kelola role member (R13 UI) |
| `/admin/komunitas` | 🟡 | Antrian kartu pengajuan dengan detail pemohon; konfirmasi approve/reject (sudah ResponsiveDialog) — poles kepadatan info |

### Akun
| Route | Kondisi | Kebutuhan UX |
|---|---|---|
| `/pengaturan/profil` | ❌ G3 | Form profil + cek ketersediaan username (sudah ada di slice) |

## 5. Fitur UX lintas-permukaan (backlog design)

1. **Onboarding login pertama:** ensure profile (G1) → sapa + arahkan: lengkapi profil → join komunitas → mulai lesson 1. Ringan, bisa dismis.
2. **Sistem empty/loading/error konsisten** — audit semua surface pakai `feedback-states`; setiap empty state punya CTA.
3. **Navigasi & IA:** transisi marketing chrome ↔ tenant shell yang tidak membingungkan; breadcrumb di kelola; "Komunitas saya" di user menu.
4. **Feedback aksi:** toast konsisten (sudah sonner), disabled/pending states seragam, konfirmasi destruktif selalu ResponsiveDialog.
5. **Aksesibilitas WCAG AA:** kontras di light theme, focus ring terlihat, target sentuh ≥44px, alt text, keyboard flow form & dialog. (Pakai skill design:accessibility-review saat audit.)
6. **Brand kit mini:** logo sederhana/wordmark, favicon, OG template, palet & tipografi terdokumentasi → `docs/BRAND.md` (output agent ui).
7. **SEO dasar:** metadata per route, sitemap, robots (cek bawaan starter), judul halaman ID.
8. **Motion tenang:** reveal saat scroll di landing, transisi halus progress ring — semua reduced-motion safe.

## 6. Rencana rilis design

- **Wave UI-A (P0):** G1–G6 + tema light+preset + landing + tenant home + lesson player + shell nav. → dampak "kebayang arah" terbesar.
- **Wave UI-B:** kelola (list/editor/quiz/komunitas) + admin + login + buka-komunitas + profil publik.
- **Wave UI-C (delight):** onboarding, motion, brand kit final, OG images, a11y audit penuh (#13 e2e menyusul di sini).

Definition of done per wave: tsc + 273 tests tetap hijau · tanpa hex hardcode (tokens) · mobile-first terverifikasi (375px & 768px) · empty/loading/error state hadir · copy ID konsisten · skill design:design-critique dijalankan atas hasil.

## 7. Prompt siap-paste — agent "ui" (design exploration, TANPA kode dulu)

```
You are agent "ui", the design-exploration agent for belajar-with-rahmanef.com (live: https://study-with.rahmanef.com). Read CLAUDE.md → AGENTS.md, then docs/UI-UX-PRD.md (your brief — binding), then browse the live site.

Phase A deliverables (NO code changes; write to docs/design/ only):
1. docs/design/TOKENS.md — proposed palette (pick from the installed theme-presets registry; name the preset), typography pairing (serif display via next/font + Inter body), spacing/radius scale, light-default rationale. Respect "Akademik & Tenang" (PRD §1) and the binding technical rules (PRD §2).
2. docs/design/SURFACE-SPECS.md — per-surface specs for Wave UI-A (PRD §6): layout sketches in words/ASCII, component inventory (existing shadcn/slice components to reuse), states (empty/loading/error), mobile behavior, copy suggestions (ID).
3. docs/design/BRAND.md — wordmark direction, favicon/OG concept.
4. Final report in chat: decisions + open questions for Rahman (max 5) + implementation split proposal (alpha shared-surface items vs per-slice items).

Boundaries: write ONLY inside docs/design/. No git. No component/code edits — implementation happens after Rahman approves Phase A. Verify your files exist in the project folder before reporting (mode rule 8).
```
