# Agent Prompts — Wave v1.5 "KONTEN" (CURRENT)

> Contract: [AGENTS.md](../AGENTS.md) · Board: [STATUS.md](STATUS.md) · Ops terbaru: [reports/vps-2026-07-16.md](reports/vps-2026-07-16.md)
> LIVE: https://study-with.rahmanef.com · backend **Convex Cloud `rare-toucan-552`** · **prod punya aktivitas user NYATA — jangan pernah purge/fake data**.
> Wave ini 100% KONTEN: 3 kursus seed baru. NOL perubahan schema/fitur/UI.

## EXECUTION MODE: Cowork parallel (same folder) — varian KONTEN

1. Worker menulis TEPAT SATU file baru: `convex/<namaSeedCamelCase>.ts` (tabel di bawah). Tidak menyentuh file lain APA PUN (tidak docs/**, convex/features/**, slices/**, schema, seed.ts/seedWebDev.ts).
2. Board milik alpha (read-only); klaim pre-claimed; lapor via chat (jumlah modul/lesson/kuis, judul-judulnya, hasil verifikasi, run command).
3. No git. 4. Modul convex non-test = camelCase (P1 §7 — Convex menolak `-`).
5. Pola WAJIB diikuti: `convex/seedWebDev.ts` (baca dulu!) — internalMutation; cari user via email index + tenant via by_slug; SKIP kalau slug course sudah ada (idempoten); insert course(status "published") → modules(order) → lessons(order, links[]) → quizzes.
6. ATURAN KONTEN:
   - Bahasa Indonesia hangat & membumi; istilah teknis tetap English (AGENTS.md §7). Gaya: seperti mentor, banyak analogi, langkah praktis yang bisa langsung dicoba GRATIS.
   - contentMd = template literal → JANGAN pakai triple-backtick di dalamnya; contoh kode/prompt ditulis sebagai INDENTED code block (4 spasi). Escape backtick/`${}` bila perlu.
   - `links`: 2–4 tautan eksternal GRATIS per lesson yang relevan (docs resmi, YouTube, artikel bebas). `youtubeVideoId` hanya jika kamu yakin ID 11-karakter valid — kalau ragu, OMIT (jangan ngarang).
   - Kuis: per modul yang ditandai, 3–5 soal MCQ 4 opsi, `passingScorePct` 60–70, `explanation` singkat tiap soal. `correctIndex` bervariasi (jangan semua 0).
   - Zero-cost law: semua praktik harus bisa diikuti tanpa bayar (free tier).
7. Slug course yang SUDAH ADA (jangan tabrak): dasar-ai, prompt-engineering, kreator-konten, ide-konten, skrip-caption, karier-digital, freelance-nol, portofolio-dilirik, bikin-aplikasi-web-dengan-ai.
8. Verifikasi sebelum lapor: file ada di FOLDER PROJECT + `wc -l` masuk akal; parse via `npx esbuild <file> --loader:.ts=ts --outfile=/dev/null` dari copy /tmp; TIDAK perlu vitest (data-only; file seed exempt LOC).

## Assignments — wave v1.5

| Agent | Row | Kursus (slug) | File |
|---|---|---|---|
| beta | #31 | AI untuk Produktivitas Kerja (`ai-produktivitas-kerja`) | `convex/seedAiKerja.ts` (export `seedAiKerjaContent`) |
| gamma | #32 | Analisis Data dengan AI (`analisis-data-dengan-ai`) | `convex/seedAnalisisData.ts` (export `seedAnalisisDataContent`) |
| delta | #33 | Orkestrasi Multi-Agent (`orkestrasi-multi-agent`) | `convex/seedMultiAgent.ts` (export `seedMultiAgentContent`) |
| vps | #34 | FINAL: run 3 seed di prod + smoke | Cloud CLI (dormant-role exception) |

Urutan: 3 worker paralel → alpha review (baca konten! bukan cuma parse) → Rahman push → vps #34.

---

## Prompt — beta (#31 AI untuk Produktivitas Kerja)

```
You are agent "beta" (Cowork parallel KONTEN; no git; STATUS read-only — row #31 pre-claimed). Kamu menulis TEPAT SATU file baru: convex/seedAiKerja.ts. Tidak menyentuh file lain.

Onboarding: CLAUDE.md → AGENTS.md → mode rules KONTEN atop docs/AGENT-PROMPTS.md → BACA convex/seedWebDev.ts sebagai pola (ikuti persis strukturnya; ganti nama fungsi jadi seedAiKerjaContent, idempoten per slug "ai-produktivitas-kerja").

Kursus: "AI untuk Produktivitas Kerja" — utk karyawan/pekerja kantoran non-IT yang mau kerja lebih cepat pakai AI, semuanya gratis. Track: kerja.
Deskripsi singkat course: bantu pekerjaan harian — menulis, dokumen, spreadsheet, rapat — dengan asisten AI, tanpa jargon.

Silabus (5 modul, 12–14 lesson, 4 kuis — kembangkan isinya sendiri, mendalam & praktis):
1. Asisten AI di Tempat Kerja — pilih alat gratis (Claude/ChatGPT/Gemini), akun & privasi data kantor (JANGAN tempel data rahasia), prompt dasar utk kerja. [kuis]
2. Menulis Lebih Cepat — email profesional (ID/EN), ringkas dokumen panjang, proposal & laporan, nada formal vs santai. [kuis]
3. Spreadsheet & Data Ringan — minta AI bikin formula Excel/Sheets, rapikan data berantakan, pivot sederhana, template gratis.
4. Rapat & Kolaborasi — agenda, notulen dari transkrip, follow-up action items, presentasi outline. [kuis]
5. Otomasi Ringan & Etika — template prompt yang bisa dipakai ulang, batas AI di kerjaan (verifikasi, bias, data sensitif), bangun kebiasaan. [kuis]

Aturan konten & verifikasi: ikut mode rules KONTEN #6 dan #8. Laporan terstruktur (daftar modul/lesson/kuis + run command), stop.
```

## Prompt — gamma (#32 Analisis Data dengan AI)

```
You are agent "gamma" (Cowork parallel KONTEN; no git; STATUS read-only — row #32 pre-claimed). Kamu menulis TEPAT SATU file baru: convex/seedAnalisisData.ts. Tidak menyentuh file lain.

Onboarding: CLAUDE.md → AGENTS.md → mode rules KONTEN atop docs/AGENT-PROMPTS.md → BACA convex/seedWebDev.ts sebagai pola (fungsi seedAnalisisDataContent, idempoten per slug "analisis-data-dengan-ai").

Kursus: "Analisis Data dengan AI" — utk siapa pun yang punya data (jualan, keuangan pribadi, media sosial) dan mau membacanya dengan bantuan AI, tanpa background statistik. Track: umum/kerja.
Deskripsi: dari file CSV/spreadsheet mentah sampai insight dan grafik yang bisa dipresentasikan — dipandu AI, gratis.

Silabus (5 modul, 12–14 lesson, 4 kuis — kembangkan sendiri):
1. Kenalan dengan Data — jenis data sehari-hari, rapi vs berantakan, siapkan contoh dataset gratis (unduhan publik / data sendiri). [kuis]
2. AI sebagai Analis Pribadi — tempel data ke chat dengan aman (anonimkan!), minta ringkasan, tanya-jawab data, deteksi tren & anomali dasar. [kuis]
3. Statistik Praktis Tanpa Rumus — rata-rata vs median (kapan mana), persentase & pertumbuhan, korelasi ≠ sebab-akibat — semua via contoh + AI. [kuis]
4. Visualisasi — pilih grafik yang tepat, minta AI bikin chart (Sheets/alat gratis), merapikan utk presentasi.
5. Studi Kasus End-to-End — satu dataset dari mentah → bersih → insight → slide ringkas; checklist verifikasi angka (AI bisa salah hitung!). [kuis]

Aturan konten & verifikasi: ikut mode rules KONTEN #6 dan #8. Laporan terstruktur, stop.
```

## Prompt — delta (#33 Orkestrasi Multi-Agent)

```
You are agent "delta" (Cowork parallel KONTEN; no git; STATUS read-only — row #33 pre-claimed). Kamu menulis TEPAT SATU file baru: convex/seedMultiAgent.ts. Tidak menyentuh file lain.

Onboarding: CLAUDE.md → AGENTS.md → mode rules KONTEN atop docs/AGENT-PROMPTS.md → BACA convex/seedWebDev.ts sebagai pola (fungsi seedMultiAgentContent, idempoten per slug "orkestrasi-multi-agent").

Kursus: "Orkestrasi Multi-Agent untuk Proyek Nyata" — kelanjutan "Bikin Aplikasi Web dengan AI": cara menjalankan BEBERAPA agent AI sekaligus utk satu proyek, seperti punya tim developer. Track: lanjutan. INI KISAH NYATA platform ini — platform belajar-with-rahmanef dibangun persis dengan metode ini; jadikan itu benang merah studi kasusnya (tanpa menyebut detail rahasia/infra).
Deskripsi: dari satu agent jadi tim agent — kontrak kerja, pembagian tugas paralel, review, dan integrasi, dipraktikkan pada proyek sungguhan.

Silabus (5 modul, 12–14 lesson, 4 kuis — kembangkan sendiri):
1. Kenapa Multi-Agent — batas satu sesi (context window, fokus), kapan 1 agent cukup, peran: integrator vs worker. [kuis]
2. Kontrak & Aturan Main — dokumen kontrak (AGENTS.md-style), konvensi kode, pembagian wilayah file (zero shared writes), claim board utk klaim tugas. [kuis]
3. Menulis Prompt Assignment — anatomi prompt worker yang baik (peran, batas dir, pola rujukan, definition-of-done, format laporan), anti-pattern umum.
4. Review & Integrasi — membaca laporan worker, verifikasi independen (typecheck/test), menangani konflik & drift, kapan menolak hasil. [kuis]
5. Studi Kasus: Platform Ini — alur 1 wave dari pre-work → 3-5 worker paralel → review → deploy; pelajaran yang bisa ditiru pembaca utk proyeknya sendiri. [kuis]

Aturan konten & verifikasi: ikut mode rules KONTEN #6 dan #8. Laporan terstruktur, stop.
```

## Prompt — vps (#34 FINAL — setelah alpha review & Rahman push)

```
You are agent "vps" (AGENTS.md §4 — dormant-role exception; secrets NAMES only). Rows: #34.

1. git pull --ff-only origin main.
2. npx convex deploy --yes HANYA bila ada modul convex baru yang perlu terdaftar (3 file seed = modul baru → perlu deploy; --dry-run dulu, konfirmasi prod rare-toucan-552).
3. Jalankan 3 seed (idempoten, aman diulang; angka hasil saja):
   npx convex run seedAiKerja:seedAiKerjaContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
   npx convex run seedAnalisisData:seedAnalisisDataContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
   npx convex run seedMultiAgent:seedMultiAgentContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
4. Smoke: /kelas/belajar-ai/ai-produktivitas-kerja, /kelas/belajar-ai/analisis-data-dengan-ai, /kelas/belajar-ai/orkestrasi-multi-agent → 200 tanpa crash; searchInTenant q sesuai judul baru memuat hasil (dashboard runner, member-authed).
5. Laporan: row counts per kursus (modul/lesson/kuis — angka), status per langkah, proposals. JANGAN purge/ubah data user.
```

## Template re-assignment — tetap (lihat riwayat git bila perlu).
