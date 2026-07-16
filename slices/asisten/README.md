# asisten — Alfa, tutor belajar AI (wave v1.6, STATUS #35)

> Bagian dari **belajar-with-rahmanef.com** (OS desktop shell). Barrel-only
> imports; lihat `index.ts` untuk kontraknya.

Asisten belajar bertenaga Claude di dalam OS shell. Dua permukaan:

1. **Window-app `asisten`** — deep-link `/asisten` (chat umum) atau
   `/asisten/<lessonId>` (Alfa ikut membaca materi yang sedang dibuka).
2. **Inspector ⌘I** — `capabilities.useChat` di-wire ke `useAsistenChat`,
   jadi panel "Alfa" bawaan shell menjawab sungguhan.

## Keamanan & biaya

- `chat:ask` = action publik dengan **login wajib** (auth langkah pertama, P0).
- Konteks materi lewat internal query yang meng-enforce **membership** dan
  **course published** — draft tidak pernah bocor lewat asisten (§6).
- Bounded per request: ≤20 pesan, ≤4000 char/pesan, konteks materi dipotong
  8000 char, jawaban `max_tokens` 1024, model Haiku (termurah).
- **Tanpa kuota per-user** (keputusan owner 2026-07-16). Kill-switch global:
  unset `ANTHROPIC_API_KEY` → Alfa melaporkan "belum aktif" dengan sopan.
- Kunci API hanya dibaca dari env server; body error provider tidak pernah
  diteruskan ke client (diassert di test).

## Aktivasi (owner)

    npx convex env set ANTHROPIC_API_KEY <kunci> --prod

Nilai kunci tidak pernah lewat repo/chat — cukup dijalankan owner sendiri.
