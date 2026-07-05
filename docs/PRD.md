# PRD — belajar-with-rahmanef.com

> v0.1 · 2026-07-05 · Status: **draft untuk review Rahman**
> Sumber: [DECISIONS.md](../DECISIONS.md) (20 Q&A). Teknis: [DATA-MODEL.md](DATA-MODEL.md), [SLICES.md](SLICES.md).

## 1. Problem statement

Banyak orang Indonesia non-IT ingin memakai AI untuk kehidupan sehari-hari, pekerjaan, dan usaha — tapi materi yang ada tersebar, berbahasa Inggris, atau terlalu teknis (fundamental/coding). Belum ada tempat belajar **pengaplikasian AI** berbahasa Indonesia yang gratis, terstruktur (kelas, progress, komunitas), dan terbuka bagi pengajar sukarelawan lain untuk ikut membuka kelas. Tanpa ini, orang belajar sporadis dari video acak tanpa arah dan tanpa komunitas.

## 2. Prinsip produk (tidak bisa ditawar)

1. **Charity.** Gratis untuk peserta & pengajar. Biaya berjalan ≈ Rp0 di luar VPS + domain yang sudah ada.
2. **Tumpang di tools gratis.** Video di YouTube (embed), diskusi di Discord. Platform hanya menyimpan struktur, materi teks, dan progress.
3. **Aplikasi, bukan fundamental.** Materi fundamental ditaut ke resource eksternal yang proper.
4. **Bahasa Indonesia**, istilah teknis tetap Inggris.

## 3. Persona & role

| Persona | Role | Kebutuhan inti |
|---|---|---|
| Pembelajar umum non-IT | member | belajar terstruktur, tahu progress-nya, tempat bertanya (Discord) |
| Pengajar sukarelawan | instructor | bikin & kelola kelas tanpa mikir infrastruktur |
| Penggerak komunitas | owner (tenant) | buka "sekolah" sendiri, kelola pengajar & member |
| Rahman | platform admin | kurasi komunitas baru, jaga kualitas, biaya tetap nol |

Target audiens campuran multi-track (umum / kerja / konten-UMKM) — tiap track diwujudkan sebagai kelas (atau komunitas) terpisah, ditambah bertahap.

## 4. Goals

- **G1 Aktivasi:** ≥40% pendaftar menyelesaikan ≥1 lesson dalam 7 hari pertama.
- **G2 Penyelesaian:** ≥25% member yang memulai kelas menyelesaikannya dalam 60 hari.
- **G3 Komunitas:** ≥100 member terdaftar dalam 3 bulan pasca-launch, organik.
- **G4 Multi-tenant terbukti:** ≥1 komunitas eksternal (bukan milik Rahman) aktif dalam 3 bulan setelah v1.1.
- **G5 Biaya:** biaya bulanan tetap ≤ biaya VPS + domain existing.

## 5. Non-goals (v1–v1.1)

- **Video hosting sendiri** — YouTube embed saja (biaya bandwidth/storage).
- **Chat/forum in-app** — Discord-first; komentar per lesson baru fase 2.
- **Pembayaran/monetisasi** — charity, tidak ada rencana.
- **Email notifikasi** — in-app + Discord webhook dulu.
- **Sertifikat PDF** — badge profil cukup.
- **Aplikasi mobile** — web responsive mobile-first.

## 6. User stories (urut prioritas per persona)

**Member**
- Sebagai calon member, aku ingin login dengan akun Google agar bisa gabung tanpa membuat password baru.
- Sebagai member, aku ingin join komunitas dan melihat daftar kelasnya agar tahu mulai dari mana.
- Sebagai member, aku ingin menonton video lesson + membaca materi + membuka link resource dalam satu halaman.
- Sebagai member, aku ingin menandai lesson selesai dan melihat progress bar per modul & kelas agar tahu sejauh mana perjalananku.
- Sebagai member, aku ingin mengerjakan quiz pilihan ganda dan langsung tahu skorku.
- Sebagai member, aku ingin mengusulkan link resource dan topik/kelas baru agar ikut membangun komunitas.
- Sebagai member, aku ingin badge kelulusan tampil di profil publikku agar bisa kubagikan.

**Instructor**
- Sebagai instructor, aku ingin membuat kelas → modul → lesson dengan menempel URL YouTube + menulis markdown, tanpa upload file.
- Sebagai instructor, aku ingin mengkurasi (approve/reject) resource & usulan dari member.
- Sebagai instructor, aku ingin memasang quiz MCQ per modul yang dinilai otomatis.
- Sebagai instructor, aku ingin memposting pengumuman yang otomatis terkirim ke channel Discord komunitas.

**Owner**
- Sebagai owner, aku ingin mengajukan komunitas baru dan mengatur profilnya (nama, deskripsi, link invite Discord, webhook).
- Sebagai owner, aku ingin mengangkat member menjadi instructor.

**Platform admin**
- Sebagai platform admin, aku ingin meninjau dan meng-approve/menolak pengajuan komunitas agar platform tetap sehat.

## 7. Requirements

### P0 — v1 (tidak launch tanpa ini)

| # | Requirement | Acceptance criteria (ringkas) |
|---|---|---|
| R1 | Auth Google via @convex-dev/auth | login/logout jalan; profil auto-terbuat saat login pertama; tidak ada opsi password |
| R2 | Landing page | menjelaskan platform, menampilkan komunitas & kelas aktif, CTA login/join; mobile-first |
| R3 | Tenant & membership (skema full multi-tenant; UI: join + halaman komunitas; komunitas pertama di-seed) | user bisa join komunitas aktif; role tersimpan; halaman `/t/[slug]` tampil; info dasar komunitas terlihat publik, konten kelas butuh join |
| R4 | Kelas → Modul → Lesson (kelola + belajar) | instructor CRUD; lesson = YouTube embed + markdown + daftar link; draft tidak terlihat member; urutan modul/lesson bisa diatur |
| R5 | Progress | tombol "tandai selesai" idempoten; progress bar per modul & kelas akurat; penyelesaian kelas tersimpan saat semua lesson selesai |
| R6 | Routing multi-tenant `/t/[slug]` | slug unik; tenant non-aktif tidak bisa diakses; guard role di halaman kelola |

### P1 — v1.1 (fast follow)

| # | Requirement | Catatan |
|---|---|---|
| R7 | Pengajuan komunitas + approval admin | form request → antrian di `/admin` → approve/reject |
| R8 | Resource board submit→kurasi | pending hanya terlihat instructor+ & pengusul; anti-spam ringan |
| R9 | Suggestion box usulan kelas/topik | pola sama dengan R8 |
| R10 | Quiz MCQ auto-graded, opsional per modul | jawaban benar tidak pernah terkirim ke client sebelum submit |
| R11 | Profil publik `/u/[username]` + badge | badge = penyelesaian kelas; bisa dibagikan |
| R12 | Pengumuman + Discord webhook | tampil in-app, auto-post ke Discord; webhook URL tidak pernah bocor ke client |
| R13 | Owner kelola role (member → instructor) | dari halaman kelola komunitas |

### P2 — fase 2 (jangan sampai arsitektur menghalangi)

Komentar per lesson · role Moderator/TA · subdomain per tenant · email (Resend) · upload file kecil dengan kuota per tenant · vote pada usulan · sertifikat PDF + verifikasi · bilingual penuh.

## 8. Success metrics

- **Leading (harian/mingguan):** signup→join rate; aktivasi 7 hari (G1); lesson selesai per minggu; submission resource/usulan (v1.1).
- **Lagging (bulanan):** member aktif bulanan; kelas selesai kumulatif; komunitas aktif; retention 30 hari.
- **Cara ukur:** query Convex sederhana (index sudah disiapkan); awalnya manual/script, dashboard admin kecil menyusul fase 2.
- **Evaluasi:** 1 minggu, 1 bulan, 3 bulan pasca-launch.

## 9. Open questions

| Pertanyaan | Pemilik | Blocking? |
|---|---|---|
| Nama & branding komunitas pertama | Rahman | sebelum launch (tidak blocking dev) |
| VPS Dokploy: spek cukup untuk Convex self-hosted (Docker)? sudah pernah jalan? | Rahman | blocking **deploy**, tidak blocking dev |
| Channel YouTube tempat video kelas | Rahman | sebelum produksi konten |
| Kurikulum detail kelas #1 ("AI untuk sehari-hari") | Rahman + Claude | paralel dengan build |
| Aturan komunitas / kode etik tertulis | Rahman | sebelum v1.1 (buka tenant eksternal) |

## 10. Rilis

| Rilis | Isi | Estimasi effort |
|---|---|---|
| **v1 (launch)** | R1–R6: scaffold, auth, tenant seed, kelas, progress, landing | 3–5 sesi kerja |
| **v1.1** | R7–R13: approval, resources+usulan, quiz, profil+badge, pengumuman | 4–6 sesi kerja |
| **Fase 2** | sesuai demand komunitas | — |

Urutan build teknis & definition of done: lihat [SLICES.md](SLICES.md).
