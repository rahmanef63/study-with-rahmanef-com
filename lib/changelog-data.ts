// Changelog — SEED DATA. This array IS the changelog: it ships with the code, so
// it is always in sync with what's live (no separate DB/deploy channel to drift).
//
// ▶ CONVENTION (every shipped update): PREPEND one entry to the TOP of CHANGELOG
//   describing the change in user-facing Bahasa Indonesia, in the same commit as
//   the change. Newest first. /changelog renders this directly. No
//   `npx convex …` step — it's static seed data.
//
// ponytail: static array, not a Convex table. A changelog entry ≈ a release, and
// releases already rebuild the frontend, so a second (Convex) publish channel
// would only add drift. Upgrade to a table only if entries must change without a
// deploy.

export type ChangeTag = "Baru" | "Tampilan" | "Perbaikan" | "Konten";

export type ChangelogEntry = {
  /** Display date, ISO `YYYY-MM-DD`. */
  date: string;
  /** Optional release label, e.g. "v1.2". */
  version?: string;
  title: string;
  /** Bullet points, Bahasa Indonesia, user-facing. */
  points: string[];
  tags?: ChangeTag[];
};

// NEWEST FIRST. Prepend here on every update.
export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-08-09",
    version: "v2.0",
    title: "Tampilan baru: halaman biasa, bukan desktop",
    tags: ["Tampilan", "Baru"],
    points: [
      "Desktop berjendela dihapus. Sekarang halaman biasa dengan empat tab di atas: Kelas · Diskusi · Anggota · Tentang. Tidak ada lagi jendela yang ditumpuk, di-minimize, atau hilang entah ke mana.",
      "Berbagi akhirnya jalan. Setiap kelas, sertifikat, dan profil punya alamat sendiri, dan kalau kamu tempel di WhatsApp yang muncul judul serta gambar kelasnya — bukan kartu generik yang sama untuk semua tautan.",
      "Tombol Bagikan baru: sekali tap langsung buka WhatsApp di HP, atau menyalin tautan di komputer.",
      "Halaman kelas sekarang terbuka langsung berisi — judul, deskripsi, dan daftar materinya sudah ada sejak detik pertama, tidak menunggu loading dulu. Google juga akhirnya bisa menemukan kelas-kelas di sini.",
      "Semua tautan lama tetap jalan; otomatis diarahkan ke alamat barunya.",
      "Pemilih tema 37 warna dan pemilih tampilan OS dihapus — tinggal terang atau gelap.",
      "Pencarian pindah ke tombol Cari di header komunitas.",
    ],
  },
  {
    date: "2026-08-09",
    version: "v2.0-fase-0",
    title: "Bersih-bersih besar sebelum tampilan baru",
    tags: ["Perbaikan"],
    points: [
      "Asisten AI “Alfa” dilepas dari platform. Fiturnya sudah lama diparkir tapi masih ikut terkirim ke browsermu setiap kali membuka situs.",
      "Penghitung kunjungan dicabut. Setiap perpindahan halaman dulu menulis satu baris ke database — sekarang tidak lagi, dan celah yang memungkinkan orang luar menulis data tak terbatas ikut tertutup.",
      "Kuis: maksimal 5 percobaan per kuis, dan kunci jawaban baru ditampilkan setelah kamu lulus atau kehabisan percobaan. Sebelumnya sekali menjawab asal sudah membocorkan semua jawabannya.",
      "Batas anti-spam komentar dan pengajuan komunitas diperbaiki — dulu bisa berhenti bekerja diam-diam kalau datanya sudah banyak.",
      "Komunitas yang ditangguhkan tidak lagi bisa dilihat katalog kelasnya lewat tautan lama.",
      "Halaman masuk disederhanakan jadi tombol Google saja — pilihan lain memang tidak pernah aktif dan hanya menimbulkan error.",
    ],
  },
  {
    date: "2026-07-16",
    version: "v1.5",
    title: "3 kelas baru di Belajar AI",
    tags: ["Konten"],
    points: [
      "“AI untuk Produktivitas Kerja” — email, dokumen, spreadsheet, dan rapat jadi lebih cepat dengan asisten AI, tanpa jargon.",
      "“Analisis Data dengan AI” — dari CSV mentah sampai insight dan slide presentasi, tanpa background statistik.",
      "“Orkestrasi Multi-Agent untuk Proyek Nyata” — kisah nyata bagaimana platform ini dibangun oleh tim agent AI, dan cara menirunya untuk proyekmu.",
    ],
  },
  {
    date: "2026-07-13",
    version: "v1.3",
    title: "Notifikasi, pencarian, dan sertifikat kelas",
    tags: ["Baru", "Konten"],
    points: [
      "Lonceng notifikasi di bar atas — balasan diskusi, hasil kurasi sumber, dan status usulanmu masuk ke satu kotak (app Notifikasi juga ada untuk semua tampilan).",
      "Pencarian per komunitas: cari judul kelas dan isi materi lewat app Cari (tombolnya ada di halaman komunitas).",
      "Sertifikat kelas yang bisa dibagikan — klik lencana di profil untuk membuka /sertifikat/… dan salin tautannya.",
      "Kelas baru di Belajar AI: “Bikin Aplikasi Web dengan AI — dari Nol sampai Live” (7 modul, 17 materi, 4 kuis).",
      "Papan sumber & kotak usulan kini menampilkan ajakan masuk yang ramah untuk pengunjung yang belum login (sebelumnya bisa bikin error).",
    ],
  },
  {
    date: "2026-07-11",
    title: "Panel Admin platform",
    tags: ["Baru"],
    points: [
      "Panel Admin platform untuk super admin — menyetujui/menolak pengajuan komunitas dan melihat statistik pengunjung, dalam satu jendela.",
      "Hanya muncul untuk admin platform.",
    ],
  },
  {
    date: "2026-07-11",
    title: "Tanda app terbuka di sidebar (ganti daftar Running)",
    tags: ["Tampilan"],
    points: [
      "Daftar “Running” di sidebar dihapus. Sebagai gantinya, app yang sedang terbuka ditandai titik kecil di barisnya sendiri — seperti taskbar Windows / dock macOS.",
      "Arahkan kursor (atau sentuh) baris app yang terbuka untuk menutupnya.",
    ],
  },
  {
    date: "2026-07-11",
    title: "Sidebar dashboard dirapikan + Changelog & Docs",
    tags: ["Tampilan", "Baru"],
    points: [
      "Sidebar dashboard kini dikelompokkan jadi grup yang bisa dibuka-tutup (dropdown) — tidak lagi menumpuk semua aplikasi jadi satu daftar panjang.",
      "Grup baru “Platform” berisi Docs (panduan) dan Changelog (catatan perubahan ini).",
      "Setiap pembaruan mulai sekarang dicatat di Changelog, biar gampang diikuti.",
    ],
  },
  {
    date: "2026-07-10",
    title: "Komunitas “Belajar AI” jadi hidup",
    tags: ["Konten"],
    points: [
      "9 sumber belajar kurasi (Claude, ChatGPT, Gemini, kursus gratis) di papan Sumber belajar.",
      "Diskusi contoh di beberapa lesson + kotak Usulan dengan vote.",
      "Beberapa anggota awal biar papan tidak kosong.",
    ],
  },
  {
    date: "2026-07-10",
    title: "Halaman kelas diperkaya",
    tags: ["Tampilan"],
    points: [
      "Silabus kelas dapat ringkasan “Tentang kelas ini” (jumlah modul, lesson, video).",
      "Kartu “Biaya sampai selesai: Gratis” dan pintasan ke Sumber belajar komunitas.",
      "Nav materi (daftar lesson) di samping saat membuka pelajaran.",
    ],
  },
  {
    date: "2026-07-09",
    version: "v1.2",
    title: "Diskusi, analitik, dan vote usulan",
    tags: ["Baru"],
    points: [
      "Komentar diskusi per lesson (balas 1 tingkat).",
      "Ringkasan analitik per kelas untuk pengajar.",
      "Vote pada usulan topik/kelas.",
    ],
  },
  {
    date: "2026-07-07",
    title: "Tampilan baru: desktop OS + Editorial Warmth",
    tags: ["Tampilan"],
    points: [
      "Antarmuka jadi “desktop” dengan aplikasi berjendela; setiap halaman punya tautan yang bisa dibagikan.",
      "Gaya visual baru “Editorial Warmth” (tipografi Fraunces + Hanken, warna hangat).",
    ],
  },
  {
    date: "2026-07-06",
    version: "v1.1",
    title: "Sumber belajar, kuis, pengumuman, profil publik",
    tags: ["Baru"],
    points: [
      "Papan sumber belajar + kotak usulan.",
      "Kuis pilihan ganda dengan nilai otomatis.",
      "Pengumuman komunitas dan halaman profil publik.",
      "Form “Ajukan komunitas” untuk membuka komunitas baru.",
    ],
  },
  {
    date: "2026-07-05",
    version: "v1",
    title: "Rilis pertama",
    tags: ["Baru"],
    points: [
      "Masuk dengan Google.",
      "Komunitas → kelas → modul → lesson (video YouTube + materi).",
      "Tandai lesson selesai dan lihat progres belajarmu.",
    ],
  },
];
