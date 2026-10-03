export const PLATFORM_ANALYTICS_COPY = {
  period: "Rentang aktivitas", days: "hari", updated: "Rentang tanggal", search: "Cari komunitas, kelas, materi, atau kuis", allCommunities: "Semua komunitas", communityFilter: "Filter komunitas",
  inventory: "Cakupan platform", activity: "Aktivitas belajar", inventoryHint: "Jumlah saat ini di seluruh platform; tidak dibatasi rentang aktivitas.", activityHint: "Agregat aktivitas dalam rentang yang dipilih; hanya anggota yang login.",
  users: "Akun", communities: "Komunitas", memberships: "Keanggotaan", courses: "Kelas", lessons: "Materi", skills: "Skills", quizzes: "Kuis",
  activeLearners: "Pelajar aktif", readMemberDays: "Bacaan anggota-hari", lessonCompletions: "Materi selesai", badges: "Lencana kelas", quizAttempts: "Percobaan kuis", quizPassed: "Percobaan lulus", comments: "Komentar baru", newMembers: "Keanggotaan baru", quizPassRate: "Kelulusan kuis",
  trends: "Aktivitas harian", trendHint: "Tanggal memakai WIB. Rincian angka tersedia di tabel harian.", dailyDetails: "Lihat angka per hari", day: "Tanggal",
  communityTable: "Perbandingan komunitas", courseTable: "Perbandingan kelas", lessonTable: "Perbandingan materi dan skills", quizTable: "Hasil kuis",
  courseHint: "Lencana dan kuis memakai rentang pilihan; materi memenuhi syarat adalah penempatan yang published pada kelas saat ini.", lessonHint: "Pembaca unik per materi dapat muncul di beberapa baris; jangan menjumlahkannya sebagai total orang.", quizHint: "Kelulusan dihitung per percobaan, termasuk percobaan ulang; bukan persentase pelajar yang lulus.",
  name: "Nama", community: "Komunitas", status: "Status", members: "Anggota", eligibleLessons: "Materi memenuhi syarat", readers: "Pembaca unik", kind: "Jenis", averageScore: "Rata-rata nilai", passRate: "Kelulusan", completeness: "Cakupan data", complete: "Lengkap", partial: "Sebagian",
  sort: "Urutkan", export: "Unduh CSV", ascending: "Naik", descending: "Turun", rows: "baris", scroll: "Geser tabel ke samping untuk melihat kolom lainnya.", empty: "Tidak ada data yang cocok dengan filter ini.",
  noActivity: "Belum ada aktivitas tercatat dalam rentang ini.", incomplete: "Sebagian sumber mencapai batas pembacaan. Angka bertanda ≥ adalah jumlah minimum; jangan menganggapnya sebagai total pasti. Tabel dan CSV hanya mencakup data yang berhasil dibaca.",
  definitions: "Definisi dan kelengkapan data", membersOnly: "Bacaan menghitung anggota yang login, sekali per materi per hari WIB. Ini bukan page view atau jumlah pengunjung website. Trafik website, sumber kunjungan, dan perangkat tersedia terpisah pada statistik pengunjung.",
  inventoryDefinition: "Keanggotaan baru adalah keanggotaan saat ini yang dibuat dalam rentang pilihan, bukan akun baru. Keanggotaan berbeda dari akun: satu akun dapat bergabung di beberapa komunitas. Inventaris mencakup status aktif, pending, suspended, published, draft, dan archived sesuai jenis datanya.",
  learnerDefinition: "Pelajar aktif adalah akun unik dengan bacaan, penyelesaian materi, lencana, percobaan kuis, atau komentar dalam rentang ini; hanya keanggotaan yang masih berlaku.",
  completionDefinition: "Materi selesai dan lencana memakai waktu penyelesaian yang tercatat. Angka ini tidak berarti semua anggota dalam periode yang sama telah menuntaskan kelas.",
  dateDefinition: "Rentang mencakup hari WIB sekarang dan hari-hari sebelumnya. Hari terakhir masih berjalan. CSV menggunakan angka mentah; kolom cakupan menandai hasil parsial.",
  source: "Sumber", rowsRead: "Baris dibaca", sources: "Kelengkapan sumber", neverRead: "Materi belum pernah dibaca", loading: "Memuat statistik platform…", unavailable: "Statistik belum tersedia.", recovery: "Coba lagi", error: "Statistik gagal dimuat. Periksa koneksi lalu coba lagi.", denied: "Statistik hanya tersedia untuk admin platform.", tablesFilter: "Pencarian dan filter berlaku pada tabel perbandingan. Ringkasan dan tren tetap mencakup seluruh platform.",
  active: "Aktif", pending: "Menunggu persetujuan", suspended: "Ditangguhkan", published: "Published", draft: "Draft", archived: "Arsip", owner: "Owner", instructor: "Instruktur", member: "Anggota",
  tenantStatus: "Status komunitas", courseStatus: "Status kelas", membershipRole: "Peran keanggotaan",
} as const;
export type PlatformAnalyticsCopy = { [K in keyof typeof PLATFORM_ANALYTICS_COPY]: string };
export type PlatformAnalyticsCopyOverride = Partial<PlatformAnalyticsCopy>;
export const mergePlatformAnalyticsCopy = (copy?: PlatformAnalyticsCopyOverride): PlatformAnalyticsCopy => ({ ...PLATFORM_ANALYTICS_COPY, ...copy });
