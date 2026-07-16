// Changelog — SEED DATA. This array IS the changelog: it ships with the code, so
// it is always in sync with what's live (no separate DB/deploy channel to drift).
//
// ▶ CONVENTION (every shipped update): PREPEND one entry to the TOP of CHANGELOG
//   describing the change in user-facing Bahasa Indonesia, in the same commit as
//   the change. Newest first. The Changelog app + the "Platform" sidebar group
//   render this directly. No `npx convex …` step — it's static seed data.
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
