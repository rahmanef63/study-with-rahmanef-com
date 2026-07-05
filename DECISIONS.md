# Decision Log — belajar-with-rahmanef.com

> Hasil sesi 20 Q&A, 2026-07-05. Platform & komunitas belajar pengaplikasian AI.
> Prinsip: charity, budget seminim mungkin, pakai tools gratis yang sudah ada (Discord, YouTube).

## Keputusan

| # | Topik | Keputusan | Catatan |
|---|-------|-----------|---------|
| 1 | Target | **Campuran, multi-track** | Jalur belajar per audiens (umum, kerja, konten/UMKM). Tiap track bisa jadi komunitas/kelas terpisah — nyambung dengan multi-tenant. |
| 2 | Format | **Self-paced + live opsional** | Materi kapan saja; sesi live sesekali via Discord. |
| 3 | Bahasa | **Indonesia, istilah teknis tetap EN** | UI & materi ID; "prompt", "context", dsb. dibiarkan. |
| 4 | Multi-tenancy | **Full multi-tenant dari awal** | Siapa pun (yang di-approve) bisa buka komunitas sendiri. ⚠️ lihat konflik dengan #18. |
| 5 | Pembuatan tenant | **Request → approval admin** | Gate anti-spam; Rahman moderator tunggal. |
| 6 | Roles | **Owner + Instructor + Member** per tenant | Moderator/TA fase 2. |
| 7 | Struktur materi | **Kelas → Modul → Lesson** | Pola LMS standar. |
| 8 | Isi lesson | **YouTube embed + markdown + link resource** | Nol biaya storage. Tanpa upload file di v1. |
| 9 | Progress | **Tandai selesai per lesson** | Progress bar per modul & kelas. |
| 10 | Quiz | **MCQ auto-graded, opsional per modul** | Tanpa koreksi manual. |
| 11 | Sharing materi | **Member submit → kurasi instructor** | Papan "Resources" per komunitas. |
| 12 | Completion | **Badge di profil** (publik, bisa dibagikan) | Tanpa PDF. |
| 13 | Diskusi | **Discord-first** | Platform hanya menaut channel; tidak menyimpan chat. Komentar per lesson = fase 2. |
| 14 | Notifikasi | **In-app + Discord webhook** | Tanpa email di v1. |
| 15 | Auth | **Google OAuth saja** via @convex-dev/auth | Provider lain nanti jika ada demand. |
| 16 | Hosting | **Dokploy VPS + Convex self-hosted** | Sesuai stack pin rr. |
| 17 | URL tenant | **Path-based `/t/[slug]`** | Subdomain = fase 2. |
| 18 | Scope MVP | **Landing + 1 kelas dulu** | ⚠️ lihat konflik dengan #4. |
| 19 | Kelas pertama | **Semua track, ditambah bertahap** + **fitur usulan kelas** | Mulai dari satu kelas, track lain menyusul. User terdaftar bisa submit usulan kelas/topik (suggestion box). |
| 20 | Next step | **Spec/PRD dulu → build** | PRD + skema Convex + daftar vertical slice, review, baru koding. |

## Konflik #4 vs #18 — ✅ RESOLVED (2026-07-05, disetujui Rahman)

*Arsitektur* full multi-tenant dari hari 1 (semua tabel ber-`tenantId`, routing `/t/[slug]` jalan) — tapi *rilis* v1 hanya berisi landing page + tenant pertama (punya Rahman) + 1 kelas. Form "buka komunitas" + flow approval menyusul di v1.1. Nol refactor, launch tetap cepat.

Spec turunan: [docs/PRD.md](docs/PRD.md) · [docs/DATA-MODEL.md](docs/DATA-MODEL.md) · [docs/SLICES.md](docs/SLICES.md)

## Fitur baru dari Q&A (di luar rencana awal)

- **Suggestion box** (dari #19): user terdaftar bisa mengusulkan kelas/topik baru; masuk antrian untuk direview owner/instructor. Bisa satu slice dengan resource board (#11) — sama-sama pola submit→kurasi.

## Implikasi arsitektur (ringkas)

- Slices kandidat: `tenants` (profil komunitas + approval), `courses` (kelas/modul/lesson + YouTube embed), `progress` (completion + badge), `resources` (submit→kurasi, termasuk suggestion box), `quiz` (MCQ), `announcements` (in-app + Discord webhook), `profiles` (profil publik + badge).
- Semua tabel Convex ber-`tenantId` + index `by_tenant`; authz per-tenant (`requireTenantRole`) di setiap mutation (P0).
- Biaya berjalan v1: VPS (sudah ada) + domain. Sisanya Rp0.

## Urutan build v1 → v1.1

1. **v1 (launch):** auth Google → tenant pertama (seed) → kelas/modul/lesson → progress → landing.
2. **v1.1:** form buka komunitas + approval, resource board + suggestion box, quiz MCQ, badge + profil publik, pengumuman + Discord webhook.
3. **Fase 2:** komentar per lesson, moderator/TA, subdomain, email.
