# BRAND — belajar-with-rahmanef.com

> Mini brand kit (UI-UX-PRD §5). Arah: **Editorial Warmth** — hangat, editorial,
> berkarakter (bukan generik/"AI slop"). Identitas bespoke, hidup di token BASE
> (`app/globals.css` `:root`/`.dark`), bukan preset. Semua warna UI lewat theme
> tokens (SSOT) — TANPA hex, kecuali aset PNG/OG + `components/brand/**`.

## Wordmark & logo

- **Wordmark:** `belajar-with-rahmanef.com` (lowercase, apa adanya).
- **Monogram / LogoMark:** mark serif, aset SVG di-code (`components/brand/logo.tsx`
  → `LogoMark` + `Logo`), diwarnai `currentColor` sehingga ikut token aktif.
  Dipakai sebagai favicon (`app/icon.svg`), lencana OG, dan brand shell OS
  (`manifest.BRAND`).
- Codename produk tetap "belajar-with-rahmanef.com"; host live
  `study-with.rahmanef.com` (keputusan brand final: pending Rahman).

## Palet — bespoke "Editorial Warmth" (token BASE, light default)

Sumber kebenaran = token `:root`/`.dark` di `app/globals.css`. Rasa: **kertas
hangat + tinta espresso + satu aksen terracotta/clay**. `DEFAULT_PRESET = null`
→ brand tampil tanpa injeksi preset; "Default" di switcher balik ke sini.
Nilai oklch nyata (jangan ubah jadi hex):

**Light (`:root`)**

- **Background** (kertas hangat): `oklch(0.986 0.006 83)`
- **Foreground** (tinta espresso, kontras AA): `oklch(0.246 0.017 55)`
- **Card** (kertas lebih terang): `oklch(0.997 0.004 83)`
- **Primary** (aksen terracotta/clay — satu aksen): `oklch(0.567 0.132 41)`
  · **Primary-foreground:** `oklch(0.98 0.008 83)`
- **Accent** (permukaan warm-neutral clay): `oklch(0.927 0.026 55)`
  · **Accent-foreground:** `oklch(0.36 0.045 44)`
- **Muted:** `oklch(0.949 0.01 79)` · **Muted-foreground:** `oklch(0.505 0.018 54)`
- **Border:** `oklch(0.902 0.013 71)`
- **Ring:** `oklch(0.567 0.132 41)` (= primary)
- **Radius:** `--radius: 0.5rem`

**Dark (`.dark`)**

- **Background** (espresso pekat): `oklch(0.203 0.012 54)`
- **Foreground** (teks kertas hangat): `oklch(0.944 0.008 83)`
- **Card:** `oklch(0.243 0.014 54)`
- **Primary** (terracotta diangkat): `oklch(0.706 0.124 46)`
  · **Primary-foreground:** `oklch(0.203 0.012 54)`
- **Accent:** `oklch(0.334 0.03 48)` · **Accent-foreground:** `oklch(0.92 0.02 70)`
- **Muted:** `oklch(0.283 0.014 52)` · **Muted-foreground:** `oklch(0.724 0.012 70)`
- **Border:** `oklch(0.345 0.014 52)`
- **Ring:** `oklch(0.706 0.124 46)` (= primary)

Preset opsional (±30, via `ThemePresetSwitcher`) boleh menimpa warna & radius —
chrome shell OS (glass/window/dock) ikut lewat remap token di `app/globals.css`.
Base tetap Editorial Warmth.

## Tipografi

- **Display (h1/h2):** serif optik **Fraunces** via `next/font/google` →
  `--font-serif` (`app/layout.tsx`; subset `latin`, style `normal` + `italic`).
  Di `@layer base`: `font-optical-sizing: auto`, `font-weight: 560`,
  `letter-spacing: -0.02em`, `line-height: 1.05` — karakter editorial, italic
  sebagai aksen.
- **Body & UI:** **Hanken Grotesk** (`--font-sans`, subset `latin`). BUKAN Inter.
  Chrome komponen (mis. CardTitle h3) tetap sans; util `font-sans` menang eksplisit.
- **Eyebrow / kicker:** util `.eyebrow` (sans, `0.75rem`, uppercase,
  `letter-spacing: 0.14em`, muted-foreground) untuk label editorial di atas h2.
- Var font (`--font-sans`/`--font-serif`) naik di `<html>` sebagai default, jadi
  preset tweakcn yang bawa fontnya sendiri bisa menimpa; "Default" balik ke sini.

## Motion

Halus & reduced-motion safe. Reveal saat scroll pakai CSS scroll-driven
animation (`animation-timeline: view()`) di `.reveal-on-scroll`, dijaga
`@media (prefers-reduced-motion)` + `@supports`; browser tanpa dukungan
menampilkan konten langsung. Tekstur `.grain` (noise SVG low-opacity) membunuh
kesan flat. Tanpa glow/gradient ramai.

## Aset — code-generated, tanpa foto stok

- **Logo/mark:** `components/brand/logo.tsx` (`Logo` + `LogoMark`, SVG,
  `currentColor`).
- **Favicon:** `app/icon.svg` (monogram).
- **OG image:** `app/opengraph-image.tsx` (`next/og`, 1200×630) — kartu kertas
  hangat + aksen terracotta.
- **Latar/tekstur:** mesh gradient + grain via CSS (`.grain` di `app/globals.css`),
  bukan raster.
- **Metadata:** `openGraph` + `twitter` di root layout; `metadataBase` = host live.

Semua visual dihasilkan dari kode (SVG/canvas/CSS). Foto stok dihapus — sengaja.

## Anti-goals

Neon, glassmorphism norak, gradient mencolok, animasi besar, kepadatan ala
trading app/dashboard, foto stok generik, font Inter/Lora/generik.
