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
    date: "2026-08-10",
    version: "v2.9",
    title: "52 materi baru, dan menu Skills untuk kumpulan prompt",
    tags: ["Konten", "Baru"],
    points: [
      "Dua kelas pembuka akhirnya selengkap kelas lanjutannya. “Dasar AI untuk Semua” dan “Prompt Engineering Praktis” naik dari 4 materi jadi 14 masing-masing — selama ini justru orang baru yang mendarat di bagian paling tipis.",
      "Komunitas Karier Digital dan Kreator Konten juga ikut dilengkapi. Totalnya 52 materi baru dalam Bahasa Indonesia, dengan contoh nyata dan alat yang semuanya gratis.",
      "Materi lama tidak diubah — yang baru menyambung, jadi kalau kamu sudah menandai sebagian selesai, progresmu tetap utuh.",
      "Menu Skills: tempat menyimpan prompt yang tinggal salin-pakai. Tiap skill punya panel prompt dengan tombol Salin, penjelasan kapan dipakai, tag, dan alamat sendiri yang bisa dibagikan.",
      "Pustaka Skills dan Materi sama-sama punya saring per tag, pencarian, dan pengurutan (terbaru, terlama, A–Z). Di Skills, pencarian juga menelusuri isi prompt-nya, bukan cuma judul.",
      "Isi prompt hanya terbuka untuk anggota. Tautan yang kamu bagikan tetap menampilkan judul supaya rapi di chat, tapi promptnya baru terbaca setelah gabung.",
      "Pustaka Skills masih kosong — pengelola komunitas bisa mulai mengisinya lewat Kelola.",
    ],
  },
  {
    date: "2026-08-10",
    version: "v2.8.1",
    title: "Pembersihan sisa struktur modul",
    tags: ["Perbaikan"],
    points: [
      "Struktur “modul” yang lama sudah dilepas sepenuhnya dari database. Tidak ada yang berubah di layarmu — kelas tetap berupa daftar materi berurutan — tapi isi platform sekarang punya satu bentuk saja, bukan dua yang harus terus disamakan.",
    ],
  },
  {
    date: "2026-08-10",
    version: "v2.8",
    title: "Materi berdiri sendiri — satu pelajaran, banyak kelas",
    tags: ["Baru", "Tampilan"],
    points: [
      "Pelajaran sekarang jadi “materi” milik komunitas, bukan milik satu kelas. Satu materi bisa diajarkan di beberapa kelas sekaligus — “Sub Agents” bisa muncul di kelas Claude Code dan kelas Hermes tanpa disalin dua kali, jadi tidak ada lagi versi yang tertinggal.",
      "Ada tab Materi baru: telusuri semua materi komunitas, saring lewat tag, dan buka lewat pencarian.",
      "Tiap materi punya alamatnya sendiri yang bisa dibagikan — tautannya tampil dengan judul asli saat dikirim ke teman, dan kini terdaftar di peta situs supaya bisa ditemukan mesin pencari.",
      "Di bawah tiap materi ada daftar “Muncul di kelas”, plus materi lain yang menautkannya.",
      "Kelas kini berupa daftar materi berurutan. Modul dihapus supaya isinya tidak bertingkat-tingkat, dan kuis pindah ke tingkat kelas.",
      "Progres belajar ikut pintar: sekali sebuah materi kamu tandai selesai, statusnya berlaku di semua kelas yang memakainya — tidak perlu mengulang.",
      "Pengelola kelas punya editor blok ala halaman Notion untuk menulis materi. Editornya hanya dimuat saat kamu mengedit, jadi halaman baca tetap ringan.",
      "Tampilan dirapikan: daftar tidak lagi berupa kotak berbingkai satu-satu, ada animasi halus saat berpindah layar, dan ukuran teks disamakan di seluruh aplikasi.",
    ],
  },
  {
    date: "2026-08-10",
    version: "v2.7",
    title: "Perbaikan: pasang ke layar utama akhirnya jalan",
    tags: ["Perbaikan"],
    points: [
      "Tombol “Tambahkan ke layar utama” tidak pernah muncul di halaman komunitas — dan itulah halaman yang paling sering dibuka. Penyebabnya berkas identitas aplikasi terpasang di bagian halaman yang tidak dibaca browser. Sekarang sudah benar di semua halaman.",
      "Ikon aplikasi untuk iPhone juga terkena masalah yang sama, jadi “Tambahkan ke layar utama” di iOS sebelumnya tidak menemukan ikonnya.",
    ],
  },
  {
    date: "2026-08-10",
    version: "v2.6",
    title: "Materi bisa jauh lebih kaya",
    tags: ["Baru", "Konten"],
    points: [
      "Isi materi dan tulisan di Diskusi sekarang bisa memuat tabel, kotak sorotan (callout), daftar centang, gambar, blok lipat, rumus matematika, dan diagram alur — sebelumnya cuma judul, paragraf, daftar, kutipan, dan blok kode.",
      "Semuanya tetap ditulis dengan markdown biasa, jadi materi yang sudah ada tidak berubah sedikit pun.",
      "Halaman tetap ringan: rumus, diagram, dan grafik baru diunduh kalau materinya memang memakai — materi biasa tidak menanggung bebannya sama sekali.",
    ],
  },
  {
    date: "2026-08-10",
    version: "v2.5",
    title: "Tampilan HP dirombak jadi aplikasi",
    tags: ["Tampilan", "Baru"],
    points: [
      "Setiap kelas sekarang punya sampul sendiri — gambar piksel ala kabinet arcade yang dibuat otomatis dari nama kelasnya. Kelas baru dapat sampulnya sendiri tanpa perlu unggah apa pun.",
      "Daftar kelas di HP jadi dua kolom. Sebelumnya satu kolom, dan hanya dua kelas yang kelihatan sebelum harus scroll — sekarang keenamnya muat dalam satu layar.",
      "Bagian atas layar dipangkas dari 261 piksel jadi 96, dan mengecil jadi 54 saat kamu scroll — seperti aplikasi iOS. Nama komunitas, logo, deskripsi panjang, dan baris tombol yang menumpuk di atas sudah dirapikan atau dipindah ke Tentang.",
      "Papan Diskusi: kotak ajakan gabung yang memakan tempat diganti satu baris, dan filter kategorinya jadi satu baris yang bisa digeser.",
      "Halaman yang khusus anggota tidak lagi menampilkan kotak besar berisi penjelasan — cukup satu kalimat dan satu tombol.",
      "Judul kelas di HP memakai huruf yang lebih mudah dibaca, jadi tidak terpotong lagi.",
    ],
  },
  {
    date: "2026-08-09",
    version: "v2.4",
    title: "Bisa dipasang di HP",
    tags: ["Baru", "Tampilan"],
    points: [
      "Sekarang bisa dipasang ke layar utama HP seperti aplikasi biasa — buka menu browser lalu pilih “Tambahkan ke layar utama”. Ikonnya muncul di antara aplikasi lain, dan dibuka tanpa bar browser.",
      "Ada bar navigasi di bawah layar HP: Kelas, Diskusi, Anggota, Peringkat, dan tombol Lainnya untuk Kalender, Tentang, Cari, dan komunitas lain. Sebelumnya keenam tab dipaksa muat di satu baris dan dua di antaranya tersembunyi di luar layar.",
      "Kalau internet putus, muncul halaman “Game Paused” yang rapi, bukan layar error browser.",
      "Tombol dan chip di HP diperbesar supaya gampang ditekan dengan jempol.",
      "Baris atas di layar kecil tidak lagi tumpang tindih.",
    ],
  },
  {
    date: "2026-08-09",
    version: "v2.3",
    title: "Tiga papan lama jadi satu",
    tags: ["Perbaikan", "Baru"],
    points: [
      "Pengumuman, Sumber belajar, dan Usulan tidak lagi jadi tiga halaman terpisah — semuanya sekarang kategori di papan Diskusi. Isi lamanya dipindahkan, tidak ada yang hilang.",
      "Antrean kurasi dihapus. Dulu tautan atau usulan yang kamu kirim menunggu disetujui pengajar dulu — dan seringkali hilang dari pandanganmu sendiri sambil menunggu. Sekarang langsung tayang; pengajar bisa menghapus atau menyematkan setelahnya.",
      "Pengajar menulis pengumuman lewat kotak tulis di Diskusi (pilih kategori Pengumuman). Tetap otomatis terkirim ke channel Discord komunitas seperti sebelumnya.",
      "Menyukai sebuah tulisan lama kamu tetap dihitung — suara dari kotak usulan lama ikut dipindahkan jadi suka, lengkap dengan poinnya di Peringkat.",
      "Pencarian sekarang juga menelusuri tulisan di Diskusi, bukan cuma judul kelas dan isi materi.",
      "Tautan lama seperti /resources/... dan /pengumuman/... tetap jalan, otomatis diarahkan ke kategori yang benar di Diskusi.",
    ],
  },
  {
    date: "2026-08-09",
    version: "v2.2",
    title: "Diskusi, Papan Skor, dan Kalender",
    tags: ["Baru"],
    points: [
      "Tab Diskusi sekarang jadi papan tulisan komunitas — tulis pertanyaan, pengumuman, usulan, atau bagikan sumber belajar, lalu saring lewat kategori di atas.",
      "Setiap tulisan punya tautan sendiri yang bisa dibagikan: ditempel ke WhatsApp langsung muncul judul dan cuplikannya. Ini yang dulu tidak ada — tidak ada satu pun hal di dalam komunitas yang punya alamat sendiri.",
      "Suka sebuah tulisan = 1 poin untuk penulisnya. Poin dan levelnya tampil di tab Peringkat (khusus anggota). Level cuma penanda keaktifan — tidak ada kelas yang dikunci di baliknya, semuanya tetap gratis.",
      "Tab Kalender baru: jadwal sesi live komunitas. Jadwalnya terbuka untuk siapa saja, tautan gabungnya khusus anggota. Pengajar bisa membuat jadwal berulang mingguan sampai 12 kali sekaligus.",
      "Ada batas 10 tulisan per hari per orang (3 di antaranya boleh berisi tautan) supaya papannya tidak jadi tempat spam.",
    ],
  },
  {
    date: "2026-08-09",
    version: "v2.1",
    title: "Tampilan baru: mesin arcade",
    tags: ["Tampilan"],
    points: [
      "Seluruh tampilan diganti jadi konsep game arcade piksel — layar CRT gelap, huruf piksel, tombol emas koin, bingkai keras dengan bayangan kotak, dan garis scanline tipis di seluruh halaman.",
      "Judul memakai huruf marquee ala mesin ding-dong; badan teks memakai huruf piksel yang tetap enak dibaca untuk materi panjang.",
      "Sudut membulat dihapus di semua tempat — kotak piksel tidak punya sudut bulat. Kartu kelas yang belum punya gambar sampul kini menampilkan pola papan catur piksel, bukan blok abu-abu.",
      "Pilihan tema warna dan tombol terang/gelap dihapus. Sekarang satu tema saja: kabinet arcade.",
    ],
  },
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
