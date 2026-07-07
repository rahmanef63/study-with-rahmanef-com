# UI/UX PRD — belajar-with-rahmanef.com (study-with.rahmanef.com)

> v2.0 · 2026-07-07 · Pemilik: alpha (integrator) · Status: **Wave UI-A/B/C SHIPPED + design overhaul "Editorial Warmth" SHIPPED**
> Konteks produk: [PRD.md](PRD.md) · kontrak: [AGENTS.md](../AGENTS.md) · aturan UI rr: [rr-conventions.md](rr-conventions.md) §UI
> Fokus dokumen: daftar fitur & permukaan + progres. Arah visual di §1 sekarang mendeskripsikan sistem yang SUDAH tayang (bukan lagi brief).

## 0. Status & progres (2026-07-07)

Legenda: ✅ selesai & tayang · 🟡 sebagian/poles lanjut · ⏸️ ditunda (nilai rendah)

**Ringkas:** semua P0 wiring gaps (G1–G6) beres; Wave UI-A/B/C beres; lalu satu **overhaul desain penuh "Editorial Warmth"** (identitas bespoke + aset code-gen + sweep responsif mobile-first) tayang. tsc bersih · **276 test hijau** · tanpa hex hardcode (kecuali aset PNG/OG) · deploy-free (tak ada perubahan `convex/**`).

Commit penting:
- `742e078` — overhaul "Editorial Warmth": token base bespoke, font Fraunces+Hanken, aset (Logo/mark, HeroBackdrop, favicon, OG), hapus foto stok 1.9MB, sweep editorial + responsif semua permukaan.
- `fbaf19a` — aktifkan slice yang ter-wire tapi tak terpakai: ThemePresetSwitcher (header + tenant nav + tab Tampilan `/pengaturan`), Toaster theme-aware, mobile syllabus (responsive-dialog), quiz confirm/taking, feedback simpan di kelola, konsolidasi empty state.
- Wave UI-A/B/C + G1–G6: commit-commit sebelumnya (mount wave, quiz, profil, pengumuman).

**Verifikasi responsif (2026-07-07):** scan anti-pattern bersih (tak ada lebar px tetap yang overflow, tak ada `<table>` tanpa `overflow-x`, tak ada `w-screen`/grid multi-kolom non-responsif yang berisiko); target sentuh ≥44px pada aksi utama/ikon; `min-w-0`+`truncate` untuk cegah overflow 360px; audit adversarial 2 putaran (0 temuan high). **Dinamis:** theme-aware (light/dark/system + ±30 preset via switcher, default = brand base), state data-driven (loading/empty/error) konsisten.

**Ditunda (nilai rendah):**
- ⏸️ Headline OG masih sans default Satori (embed byte Fraunces butuh fetch font saat build — berisiko; mark+palet sudah bawa identitas).
- ⏸️ Vendoring primitive Badge/Progress/Tooltip (konsolidasi murni, komponen tangan-rakit sudah tokened).
- ⏸️ data-table admin queue (butuh dep @tanstack/react-table; volume masih rendah).
- ⏸️ member count di header tenant-home (butuh query count publik + deploy).

## 1. Arah visual — "Editorial Warmth" (tayang)

> Menggantikan brief awal "Akademik & Tenang" (Inter + preset nature) yang ditolak karena terasa generik/"AI slop". Identitas kini bespoke & ada di token BASE — lihat `app/globals.css`, `components/brand/**`, dan memory `design-system`.

Prinsip yang tayang:

1. **Identitas ada di token base**, bukan preset. `app/globals.css` `:root`/`.dark` = palet bespoke (kertas hangat / tinta espresso / aksen **terracotta**, oklch). `app/layout.tsx` `DEFAULT_PRESET = null` → brand tampil tanpa injeksi preset; switcher "Default" balik ke sini.
2. **Tipografi berkarakter.** Display serif **Fraunces** (optical, ada italic aksen) untuk h1/h2 + `font-serif`; body/UI **Hanken Grotesk**. BUKAN Inter/Lora.
3. **Bahasa layout editorial.** Header seksi = kicker `.eyebrow` + h2 serif + intro (rujukan: `app/(public)/page.tsx`). Garis rambut > kartu berbayang tebal; ritme vertikal lega; satu aksen terkendali (angka, garis, satu kata di-italic).
4. **Aset = code, bukan raster.** `components/brand/logo.tsx` (Logo + LogoMark, `currentColor`), `components/brand/hero-backdrop.tsx` (mesh gradient + grain dari token), `app/icon.svg`, `app/opengraph-image.tsx`. Foto stok dihapus.
5. **Default LIGHT**, dark & preset via switcher. Motion tenang (reveal saat scroll, reduced-motion safe).
6. **Copy Bahasa Indonesia tenang & memandu**; istilah teknis tetap EN.

Anti-goals: neon/glassmorphism, gradient mencolok, animasi besar, kepadatan dashboard, foto stok generik, font Inter/generik.

## 2. Aturan teknis yang MENGIKAT

- shadcn primitives only · **theme tokens only** (`bg-background` dst.; TANPA hex, kecuali aset PNG/OG + `components/brand/**`) · **mobile-first** · exactly one chrome per surface (marketing chrome vs tenant shell).
- **Empty/loading/error:** konvensi repo = `@/components/ui/empty` (dipakai announcements, admin queue, landing, komunitas-saya, kelola). Slice `feedback-states` sengaja TIDAK dipakai (preset EN, lawan konvensi). Skeleton via `@/components/ui/skeleton`.
- Copy via props `labels`/config (default ID). Slice frontend files kebab-case; JANGAN sentuh `convex/**`.
- Kepemilikan: komponen `slices/<slug>/**` milik slice owner; `app/**`, token/tema/font/brand milik alpha. Cross-slice hanya via barrel `@/features/<slice>`.

## 3. P0 — WIRING GAPS — ✅ SEMUA SELESAI

| # | Gap | Status |
|---|---|---|
| G1 | `useEnsureProfileOnFirstLogin` tak dipanggil | ✅ `components/profile-bootstrap.tsx` di root (dalam ConvexClientProvider) |
| G2 | Tak ada logout / user menu | ✅ `components/user-menu.tsx` (avatar → Profil publik, Pengaturan, Komunitas saya, Keluar) |
| G3 | `/pengaturan/profil` yatim | ✅ ter-mount + tab **Tampilan** (mode+preset) + link dari user menu |
| G4 | `/t/[slug]/kelola/komunitas` yatim | ✅ TenantSettingsView ter-mount (profil komunitas + Discord webhook) |
| G5 | Default theme = system | ✅ `defaultMode="light"` + brand base sebagai default (preset null) |
| G6 | Nama user di header bukan menu | ✅ trigger user menu (G2) |

## 4. Inventaris permukaan — kondisi per 2026-07-07

Legenda: ✅ tayang (editorial + responsif) · 🟡 poles lanjut opsional
Catatan umum: SEMUA permukaan sudah dapat treatment Editorial Warmth + responsif mobile-first + target sentuh ≥44px.

### Publik (chrome: marketing header+footer)
| Route | Status | Catatan |
|---|---|---|
| `/` landing | ✅ | Hero backdrop code-gen (mesh+grain), etalase kelas nyata per komunitas, "cara kerja" grid divider-rambut, pull-quote, CTA sadar-auth (`hero-cta.tsx`), footer branded (Logo serif + eyebrow + sosial 44px), OG+favicon baru |
| `/login` | ✅ | Split editorial (value-props tampil di mobile), eyebrow+serif, returnTo |
| `/buka-komunitas` | ✅ | Alur bernomor, header editorial |
| `/u/[username]` | ✅ | Kartu identitas editorial (avatar besar, nama serif), badge wall grid divider-rambut, aksi owner "Edit profil", salin tautan |

### Belajar — member (chrome: tenant shell)
| Route | Status | Catatan |
|---|---|---|
| `/t/[slug]` home | ✅ | Header komunitas editorial (eyebrow+nama serif+track chip), grid kelas 1→sm:2→lg:3 dengan progress ring member, teaser pengumuman, empty state hangat. (🟡 member count ditunda) |
| `/t/[slug]/kelas/[kelasSlug]` | ✅ | Silabus ceklis progress, modul serif+numeral, quiz CTA per modul (di bawah modulnya), progress bar |
| `.../belajar/[lessonId]` player | ✅ | Kolom fokus-baca, nav prev/next, selesai sticky, sidebar silabus (desktop) + **drawer silabus mobile** (responsive-dialog, baris 44px) + progress bar |
| `/t/[slug]/resources` | ✅ | Grid kartu favicon, tab pending kurator, empty state, hover tokened |
| `/t/[slug]/usulan` | ✅ | Daftar usulan + status, form ringan, aksi triase 44px |
| `/t/[slug]/pengumuman` | ✅ | Kartu tanggal relatif (Intl id), badge "terkirim ke Discord" |
| Tenant shell (nav) | ✅ | Brand LogoMark→Logo, tab scrollable `overflow-x-auto` 44px, switcher tema + user menu, tak overflow di 360px |

### Kelola — instructor/owner (chrome: tenant shell)
| Route | Status | Catatan |
|---|---|---|
| `/t/[slug]/kelola/kelas` | ✅ | List + status chips, empty state shared `Empty`, header editorial |
| `.../kelola/kelas/[courseId]` editor | ✅ | Tree modul→lesson responsif (baris stack di mobile, judul truncate, aksi 44px), grip mati dihapus, feedback simpan (toast + pending lock) |
| `.../quiz/[moduleId]` builder | ✅ | Kartu per soal (numeral serif), target 44px, hapus via responsive-dialog |
| `/t/[slug]/kelola/komunitas` | ✅ | Form profil komunitas + Discord (G4), editorial+responsif |
| `/admin/komunitas` | ✅ | Antrian kartu, aksi approve/reject stack 44px di mobile, ResponsiveDialog |

### Akun
| Route | Status | Catatan |
|---|---|---|
| `/pengaturan/profil` | ✅ | Tab Profil (form + cek username + preview avatar live + link profil publik) + tab **Tampilan** (mode+preset), sign-in CTA saat signed-out |

## 5. Fitur UX lintas-permukaan

1. ✅ **Onboarding login pertama** — ensure profile (G1) + `onboarding-nudge` ringan bisa dismiss.
2. ✅ **Empty/loading/error konsisten** — via `components/ui/empty` + skeleton (bukan feedback-states).
3. ✅ **Navigasi & IA** — chrome marketing ↔ tenant shell, "Komunitas saya" di user menu, CTA "Kelola" kontekstual.
4. ✅ **Feedback aksi** — toast sonner theme-aware, pending/disabled seragam, konfirmasi destruktif = ResponsiveDialog.
5. ✅ **Aksesibilitas** — kontras diperbaiki (kicker/numeral pakai foreground di area muted; `--input` dinaikkan), focus ring, target ≥44px, aria-label ikon, keyboard flow. (🟡 border input hairline < 3:1 by-design — carried-forward; embed OG font ditunda)
6. ✅ **Brand kit** — Logo/mark, favicon, OG, palet & tipografi terdokumentasi di `docs/design/BRAND.md` + memory `design-system`.
7. 🟡 **SEO dasar** — metadata per route + OG + favicon ada; sitemap/robots cek bawaan starter.
8. ✅ **Motion tenang** — reveal saat scroll (CSS scroll-driven, reduced-motion safe).

## 6. Rencana rilis design — status

- ✅ **Wave UI-A (P0):** G1–G6 + tema light + landing + tenant home + lesson player + shell nav.
- ✅ **Wave UI-B:** kelola (list/editor/quiz/komunitas) + admin + login + buka-komunitas + profil publik.
- ✅ **Wave UI-C (delight):** onboarding, motion, OG, a11y.
- ✅ **Design Overhaul "Editorial Warmth" (`742e078`):** identitas bespoke (token base + Fraunces/Hanken), aset code-gen (Logo/HeroBackdrop/favicon/OG), sweep editorial + responsif mobile-first semua permukaan, hapus foto stok. Verifikasi: 2 putaran audit adversarial (0 high), scan anti-pattern responsif bersih.

Definition of done: tsc + **276 test** hijau · tanpa hex hardcode (tokens) · mobile-first terverifikasi (360/768/1280) · empty/loading/error hadir · copy ID konsisten · target sentuh ≥44px.

## 7. Catatan historis — prompt agent "ui" (fase eksplorasi awal, SUDAH dieksekusi)

Fase eksplorasi desain awal (brief "Akademik & Tenang", output ke `docs/design/`) sudah dijalankan dan kemudian di-supersede oleh overhaul "Editorial Warmth" (§1). Prompt aslinya diarsipkan di riwayat git bila diperlukan.
