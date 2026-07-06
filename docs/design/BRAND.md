# BRAND — belajar-with-rahmanef.com

> Mini brand kit (UI-UX-PRD §5.6). Arah: **Akademik & Tenang** — tenang, hangat,
> mengutamakan keterbacaan. Semua warna UI lewat theme tokens (SSOT), bukan hex.

## Wordmark & logo

- **Wordmark:** `belajar-with-rahmanef.com` (lowercase, apa adanya).
- **Monogram:** huruf **`b`** serif di dalam kotak membulat hijau tua.
  Dipakai sebagai favicon (`app/icon.svg`) dan lencana di OG image.
- Codename produk tetap "belajar-with-rahmanef.com"; host live
  `study-with.rahmanef.com` (keputusan brand final: pending Rahman).

## Palet — preset `nature` (light default)

Sumber kebenaran tone = theme-presets registry (`nature`), diterapkan
pre-hydration via `ThemePresetStyle` (tanpa FOUC). Rasa:

- **Background:** cream hangat (`oklch(0.97 0.01 80)`).
- **Foreground:** cokelat-abu tua, kontras tinggi (AA).
- **Aksen (primary):** hijau tua tenang (`oklch(0.52 0.13 144)`) — satu aksen saja.
- Netral warm-gray untuk muted/border.

Ganti arah warna cukup lewat `DEFAULT_PRESET` di `app/layout.tsx`
(mis. `elegant-luxury` = burgundy, `clean-slate` = indigo, `vintage-paper` = kertas jurnal).

## Tipografi

- **Display (h1/h2):** serif **Lora** via `next/font` → `--font-serif`
  (`@layer base` di `app/globals.css`). Karakter akademik, hierarki lewat ukuran.
- **Body & UI:** **Inter** (`--font-sans`). Prose lega: `leading-7`, measure ±68ch.
- Var font ada di `<body>` → menang atas font token milik preset.

## Motion

Halus & reduced-motion safe. Reveal saat scroll pakai CSS scroll-driven
animation (`animation-timeline: view()`) di `.reveal-on-scroll`; browser tanpa
dukungan menampilkan konten langsung (tanpa animasi). Tanpa glow/gradient ramai.

## OG & favicon

- **Favicon:** `app/icon.svg` (monogram `b`).
- **OG image:** `app/opengraph-image.tsx` (`next/og`, 1200×630) — kartu cream +
  hijau, tagline "Belajar pakai AI, bareng-bareng."
- **Metadata:** `openGraph` + `twitter` di root layout; `metadataBase` = host live.

## Anti-goals

Neon, glassmorphism, gradient mencolok, animasi besar, kepadatan ala trading app.
