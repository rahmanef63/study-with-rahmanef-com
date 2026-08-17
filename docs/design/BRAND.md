# BRAND — study-with.rahmanef.com

> **Ditulis ulang 2026-08-17.** Versi sebelumnya mendokumentasikan arah
> **"Editorial Warmth"** (Fraunces + Hanken Grotesk, palet terracotta, default
> TERANG, preset tema ±30) — tiga arah desain sebelum yang sekarang. Tidak ada
> satu pun angkanya yang masih benar, dan `README.md` sudah menandainya sebagai
> perlu ditulis ulang sejak lama. Yang di bawah ini dibaca langsung dari
> `app/globals.css` dan `app/layout.tsx`.
>
> **SSOT tetap kode.** Dokumen ini turunan. Kalau berbeda, `app/globals.css`
> yang benar — dan yang harus diperbaiki adalah dokumen ini.

## Arah

**Permukaan bersih, gelap, tanpa gimmick.** Satu aksen emas, satu aksen sekunder
sian, bingkai 1px, sudut kecil, bayangan sebagai kedalaman biasa (blur kecil,
spread negatif) — bukan hard-offset ala stiker.

Dua arah sebelumnya sudah dipensiunkan dan **jangan dihidupkan lagi tanpa
keputusan baru**: "Editorial Warmth" (terracotta, serif optik) dan "Arcade
Cabinet" (piksel 8-bit, `--radius: 0`, hard shadow, Press Start 2P). Yang tersisa
dari era arcade hanya `components/brand/logo.tsx` — dipertahankan karena grid
16px-nya membuat mark tetap tajam di favicon, bukan karena gayanya.

## Tema — SATU, selalu gelap

`<html>` membawa `class="dark"` permanen (`app/layout.tsx`), dan `:root` maupun
`.dark` berisi palet yang **sama persis**, supaya setiap utility `dark:` bawaan
shadcn tetap resolve seperti maksud penulisnya. Tidak ada switcher; menambahkan
mode terang berarti menulis palet kedua dari nol.

Slice `theme-presets` sudah **dihapus** (pivot rute 2026-08-09). Tidak ada
`ThemePresetSwitcher`, tidak ada injeksi preset.

## Palet — token BASE (`app/globals.css`)

Nilai asli oklch. Hex hanya sebagai rujukan mata; **jangan tulis hex di kode** —
UI lewat token, tanpa kecuali (aset PNG/OG + `components/brand/**` boleh).

| Token | oklch | ≈ hex | Peran |
|---|---|---|---|
| `--background` | `oklch(0.17 0.028 264)` | `#090f1c` | latar biru-malam |
| `--foreground` | `oklch(0.95 0.012 240)` | `#e8f0f6` | teks utama |
| `--card` | `oklch(0.225 0.031 264)` | `#141c2a` | permukaan terangkat |
| `--primary` | `oklch(0.845 0.166 88)` | `#f9c423` | aksen emas — SATU aksen |
| `--accent` | `oklch(0.79 0.14 199)` | `#00d5dc` | aksen sekunder sian |
| `--muted-foreground` | `oklch(0.735 0.028 250)` | `#9cabbb` | teks sekunder |
| `--border` | `oklch(0.41 0.045 262)` | `#3d4b63` | garis 1px |
| `--ring` | `oklch(0.845 0.166 88)` | `#f9c423` | ring fokus (= primary) |

**`--radius: 0.375rem`** (6px), dan tangga turunannya dijepit
`max(0px, calc(var(--radius) - Npx))` — `calc()` yang menghasilkan radius negatif
itu tidak valid dan deklarasinya dibuang diam-diam oleh browser.

**Warna border default WAJIB di dalam `@layer base`.** CSS tanpa layer
mengalahkan setiap cascade layer berapa pun spesifisitasnya, dan Tailwind
memancarkan utility ke `@layer utilities` — aturan `*{border-color}` yang tak
ber-layer pernah memaksa 65 utility border memakai satu warna abu yang sama di
produksi (`42898ca`). Dijaga oleh `components/ui/design-system.test.ts`.

## Tipografi

- **Display:** **Sora** via `next/font/google` → `--font-display-face` di
  `<html>`, dipakai lewat util `font-display`. Menggantikan **Press Start 2P**:
  huruf 8-bit itu dua kali lebih lebar per glyph, jadi judul kelas terpotong dan
  heading materi membungkus dua sampai lima baris.
- **Body & UI:** **stack UI platform** (`ui-sans-serif, system-ui, …`), sengaja
  tidak diunduh. Badan teks adalah tempat hampir semua glyph di situs ini hidup;
  stack sistem sudah ter-hint untuk layar pembacanya sendiri, tidak perlu unduh,
  dan tidak bisa flash. Body face piksel (Pixelify Sans) pernah dicoba dan
  ditolak owner karena sulit dibaca.
- **Skala kustom:** `--text-caption` · `--text-title` · `--text-marquee`
  (+ `-lg`), masing-masing lengkap dengan line-height & letter-spacing-nya.
- **Eyebrow:** util `.eyebrow` (uppercase, tracking lebar, muted) — dipakai di
  ~71 tempat sebagai label kecil di atas heading.

> Sebagian komentar di komponen masih beralasan "pakai body face, jangan display
> face — Press Start 2P memotong judul". Alasannya berasal dari face yang sudah
> pensiun. Stylingnya dibiarkan apa adanya karena mengubahnya = keputusan desain,
> bukan pembersihan komentar.

## Motion

Halus dan aman untuk `prefers-reduced-motion`. `.reveal-on-scroll` memakai
scroll-driven animation (`animation-timeline: view()`), dijaga `@supports` +
media query; browser tanpa dukungan menampilkan konten langsung. Tekstur
`.grain` (noise SVG opacity rendah) membunuh kesan flat.

## Aset — dihasilkan dari kode

- **Mark:** `components/brand/logo.tsx` (`Logo` + `LogoMark`, SVG,
  `currentColor`, ~1 KB). **Jangan pernah meng-import PNG merek ke komponen.**
- **Favicon:** `app/icon.svg`.
- **Kartu OG:** `app/opengraph-image.tsx` + `lib/og.tsx`, digenerate per halaman
  (8 rute punya `opengraph-image.tsx` sendiri).
- **PNG di `public/brand/`** untuk DI LUAR app (README, Discord, dek). Statusnya
  bermasalah dan sengaja belum diperbaiki: file-nya bertulis "STUDY WITH RAHMAN"
  sementara lockup app sendiri berbunyi "belajar·with·rahmanef" — nama merek
  final masih pending owner (AGENTS.md §9), jadi ekspor ulang yang setia justru
  akan mereproduksi merek yang salah. Detail: `docs/ASSETS.md`.

## Anti-goals

Neon, glassmorphism norak, gradient mencolok, animasi besar, kepadatan ala
dashboard trading, foto stok generik, font generik (Inter/Roboto/Arial), dan
hex yang ditulis langsung di komponen.
