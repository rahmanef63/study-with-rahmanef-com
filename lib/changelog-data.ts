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
    date: "2026-08-14",
    version: "v4.3",
    title: "Beranda — ringkasan belajarmu di satu halaman",
    tags: ["Baru", "Tampilan"],
    points: [
      "Ada tombol Beranda di menu samping, tepat di bawah nama komunitas (bersebelahan dengan Kelola kalau kamu pengelola). Isinya ringkasanmu: berapa materi selesai, berapa kelas tuntas, berapa komunitas yang kamu ikuti.",
      "Di bawahnya: kelas yang sedang kamu jalani lengkap dengan bar progres dan hitungan materi, kelas yang belum kamu mulai, lalu daftar komunitasmu.",
      "Komunitas, Roadmap, dan Peta belajar pindah dari menu samping ke halaman Beranda sebagai kartu. Di menu mereka cuma tiga baris tanpa penjelasan; sebagai kartu ada ruang untuk satu kalimat tentang gunanya masing-masing.",
      "Semua itu diambil dalam satu permintaan ke server, bukan satu per kelas — kalau tidak, halaman ini akan membuka puluhan sambungan sekaligus.",
    ],
  },
  {
    date: "2026-08-14",
    version: "v4.2",
    title: "Ganti komunitas dari menu, dan menu akun sendiri",
    tags: ["Baru", "Tampilan"],
    points: [
      "Nama komunitas di atas menu samping sekarang bisa diklik: isinya daftar komunitas lain, lengkap dengan gambarnya, plus jalan ke direktori. Sebelumnya di situ cuma ada tautan “‹ Komunitas lain” yang searah.",
      "Bagian bawah menu jadi satu baris berisi foto dan namamu. Diklik, keluar menu berisi Profil, Notifikasi, Pengaturan, Changelog, dan Keluar. Sebelumnya empat baris terpasang permanen, dan “Keluar” cuma ada di dalam Pengaturan.",
      "Komunitas, Roadmap, dan Peta belajar sekarang selalu muncul di kelompok “Jelajah” — di dalam komunitas mana pun, atau di luar semuanya. Sebelumnya “Komunitas” hilang begitu kamu masuk ke salah satu komunitas, justru saat kamu paling mungkin mencarinya.",
      "Daftar komunitas hanya diambil saat menunya dibuka, jadi tidak ada beban tambahan di halaman yang menunya tidak disentuh.",
    ],
  },
  {
    date: "2026-08-14",
    version: "v4.1",
    title: "Bagian Akun tidak lagi ikut tergulir",
    tags: ["Perbaikan"],
    points: [
      "Menu samping sekarang punya tiga bagian terpisah: identitas komunitas di atas, daftar tujuan di tengah, dan Akun di bawah. Hanya bagian tengah yang bisa digulir.",
      "Efeknya: sepanjang apa pun daftar tujuannya — komunitas dengan semua tab aktif, dan kamu sudah masuk akun — baris Akun tetap terlihat. Sebelumnya ia ikut tergulir ke luar layar, dan itu justru baris yang dicari orang saat mereka tersesat.",
    ],
  },
  {
    date: "2026-08-14",
    version: "v4.0",
    title: "Menu samping dirapikan",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Di laptop, menu sampingnya sebelumnya sudah harus digulir padahal kamu belum masuk akun — dan yang kepotong duluan justru bagian Akun di paling bawah. Barisnya sekarang lebih rapat di layar besar, jadi semuanya muat sekaligus. Di HP tinggi tombolnya tidak berubah, tetap enak disentuh.",
      "Judul kelompok “JELAJAH” dan “AKUN” tadinya terlalu redup untuk dibaca — di bawah ambang keterbacaan yang wajar. Sekarang dinaikkan.",
      "Antar kelompok diberi garis pemisah. Sebelumnya kelompok terbesar justru satu-satunya yang tanpa judul, jadi delapan baris terlihat mengambang lalu tiba-tiba ada dua judul kecil di bawahnya.",
      "Bagian Akun sekarang menempel di dasar menu, bukan menggantung di tengah dengan ruang kosong di bawahnya.",
    ],
  },
  {
    date: "2026-08-14",
    version: "v3.9",
    title: "Ilustrasi masuk ke halaman-halaman yang sebelumnya polos",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Delapan jalur di halaman Roadmap sekarang punya ilustrasinya masing-masing, dan gambar yang sama ikut muncul di hasil Peta belajar — jadi jalur yang kamu baca di dua tempat itu terlihat sebagai satu hal yang sama.",
      "Halaman Roadmap juga dapat gambar jalur pendakian bertingkat DASAR sampai MAHIR di sisi kanan. Hanya di layar lebar — di ponsel gambar setinggi itu akan memakan seluruh layar pertama, jadi sengaja tidak ditampilkan.",
      "Halaman Masuk, Changelog, halaman error, kotak pencarian kosong, Skills, dinding lencana, dan Diskusi yang masih kosong: semuanya sebelumnya cuma ikon kecil atau tidak ada gambar sama sekali.",
      "Berkas PNG lama yang cacat atau tidak dipakai dibuang (wordmark putih-di-atas-putih, wordmark terpotong, kartu bagikan). Ikon aplikasi tetap PNG — Safari menolak WebP untuk ikon layar utama, dan mengubahnya diam-diam mematikan dua pemeriksaan ikon Android.",
      "Aset baru yang diunggah ke folder sementara tidak dipakai: isinya kartu jadi yang teksnya sudah tercetak, sebagiannya menggambar ulang ilustrasi yang sudah ada. Yang bisa dipakai aplikasi ini adalah gambar tanpa teks, bukan kartu jadi.",
    ],
  },
  {
    date: "2026-08-13",
    version: "v3.8",
    title: "Ilustrasi buatan sendiri di seluruh aplikasi",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Ada 91 gambar baru yang diunggah. Ternyata isinya cuma 76 gambar berbeda — sepuluh pasang kembar persis, dan dua di antaranya bertukar nama (berkas bernama “new learner” isinya gambar “problem solver”). Setiap gambar dibuka satu per satu dan diberi nama sesuai isinya, bukan sesuai nama berkasnya.",
      "Semuanya diubah ke format WebP dan ditata ke map berdasarkan perannya: keadaan kosong, status, ilustrasi umum, lencana, sampul kelas, dan gambar besar. Total 37 MB jadi 1,9 MB — turun 95%, tanpa ada yang terlihat pecah.",
      "Halaman depan sekarang memakai ilustrasi asli di tiga kartu “Tiga cara mulai”, dan halaman 404, offline, direktori komunitas, kalender, serta papan peringkat punya gambarnya sendiri.",
      "21 gambar ternyata punya kotak biru tua tercetak di belakangnya — warnanya beda tipis dari latar aplikasi, jadi akan tampak sebagai kotak yang menempel. Latar itu dibersihkan jadi benar-benar transparan.",
      "Sebagian gambar sengaja belum dipakai: teksnya sudah tercetak jadi piksel, dan beberapa bahkan menggambar tombol kuning palsu yang tidak bisa diklik. Yang seperti itu dipindah jadi bahan unggahan media sosial, bukan tempelan di aplikasi.",
      "Ditambahkan pemeriksaan otomatis: kalau ada berkas gambar terhapus atau pindah sementara kodenya masih menunjuk ke situ, pemeriksaan gagal. Sebelumnya tidak ada satu pun yang menangkap hal ini — gambar rusak baru ketahuan setelah dibuka orang.",
    ],
  },
  {
    date: "2026-08-12",
    version: "v3.7",
    title: "Halaman depan",
    tags: ["Baru", "Tampilan"],
    points: [
      "Alamat utama situs sekarang punya halaman depan sungguhan. Sebelumnya ia langsung melempar ke komunitas — praktis, tapi orang yang datang dari hasil pencarian atau tautan yang dibagikan mendarat di tengah-tengah tanpa tahu tempat apa ini.",
      "Isinya: apa platform ini, berapa kelas dan anggotanya (angka nyata, bukan tulisan tangan), tiga cara mulai, dan daftar kelas yang sedang jalan.",
      "Buat kamu yang sudah anggota tidak ada yang hilang — tombol pertama langsung masuk ke komunitas, dan menunya tetap ada di setiap layar.",
    ],
  },
  {
    date: "2026-08-12",
    version: "v3.6",
    title: "Pilih foto profil tanpa perlu tahu alamatnya",
    tags: ["Baru"],
    points: [
      "Di Pengaturan sekarang ada pilihan foto profil siap pakai — tinggal ketuk. Sebelumnya kolomnya cuma kotak teks, jadi enam gambar yang sudah kami sediakan praktis tidak bisa ditemukan siapa pun.",
      "Masih ada pilihan “Tanpa foto” yang memakai inisial namamu, dan kolom alamat gambar tetap ada kalau kamu mau memakai fotomu sendiri.",
      "Bisa dijalankan dengan keyboard: satu kali Tab masuk ke deretannya, lalu panah kiri-kanan untuk memilih.",
    ],
  },
  {
    date: "2026-08-12",
    version: "v3.5",
    title: "Ikon, ilustrasi, dan gambar aplikasi yang asli",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Ikon aplikasi, favicon, dan ikon layar utama sekarang memakai artwork asli, bukan gambar sementara yang dibuat program.",
      "Ikon untuk Android dibuat ulang dengan ruang aman di tepinya. Versi sebelumnya persis sama dengan ikon biasa, jadi Android akan memotongnya sampai masuk ke tulisannya.",
      "Halaman 404, halaman offline, dan tampilan “belum ada isinya” punya ilustrasinya sendiri. Ilustrasi halaman offline ikut disimpan supaya tetap muncul saat kamu benar-benar tidak punya koneksi.",
      "Semua gambar dipadatkan: total berkas gambar turun dari 9 MB jadi 2,6 MB tanpa ada yang terlihat pecah — halaman jadi lebih cepat terbuka, terutama di kuota tipis.",
      "Halaman Changelog dan Kalender sebelumnya tidak punya gambar pratinjau saat dibagikan. Sekarang punya.",
    ],
  },
  {
    date: "2026-08-12",
    version: "v3.4",
    title: "Menu sekarang ada di semua halaman",
    tags: ["Perbaikan"],
    points: [
      "Enam halaman ternyata masih tanpa menu sama sekali: Peta belajar, Roadmap, halaman masuk, sertifikat, dan dua halaman admin. Kalau kamu mendarat di salah satunya dari tautan yang dibagikan, tidak ada satu pun jalan ke bagian lain situs. Sekarang semuanya punya menu yang sama.",
      "Halaman offline sengaja tetap polos — halaman itu muncul justru saat tidak ada koneksi, dan menunya butuh koneksi untuk tahu kamu siapa.",
    ],
  },
  {
    date: "2026-08-11",
    version: "v3.3",
    title: "Satu menu untuk seluruh aplikasi",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Menu sampingnya tinggal satu. Sebelumnya ada dua sistem menu yang berbeda — satu di dalam komunitas, satu lagi di halaman akun — jadi menunya berganti total setiap kali kamu pindah. Sekarang bentuknya sama di mana pun kamu berada, hanya isinya yang menyesuaikan.",
      "Halaman Changelog akhirnya ikut punya menu. Begitu juga halaman profil.",
      "Roadmap dan Peta belajar sekarang bisa dibuka dari mana saja. Sebelumnya keduanya cuma ada di menu komunitas, jadi dari halaman Pengaturan kamu tidak bisa ke sana sama sekali.",
      "Menu bawah di HP juga tinggal satu bentuk: empat tujuan plus tombol Menu, di halaman mana pun.",
    ],
  },
  {
    date: "2026-08-11",
    version: "v3.2",
    title: "Materi jauh lebih enak dibaca, dan halaman profil punya menu",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Isi materi sekarang diketik untuk dibaca lama: hurufnya lebih besar, jarak antar barisnya lega, dan lebar barisnya dibatasi supaya matamu tidak kehilangan baris berikutnya. Sebelumnya 14 piksel dengan jarak rapat di kolom selebar layar — sekitar 95 huruf per baris, hampir dua kali lipat batas nyaman.",
      "Judul materi, kelas, dan nama orang tidak lagi memakai huruf arcade. Huruf itu tetap memegang menu, label, dan nama bagian — tapi judul isi ada untuk dibaca, bukan untuk dipajang.",
      "Menu bawah dirombak mengikuti pola aplikasi: ikon duduk di dalam kotak, dan kotaknya terisi penuh saat aktif. Bentuk yang terisi masih terbaca di bawah matahari dan bagi yang buta warna — warna ikon saja tidak.",
      "Halaman profil publik akhirnya punya menu. Sebelumnya halaman itu jalan buntu: dibuka dari tautan yang dibagikan, lalu tidak ada satu pun jalan ke bagian lain situs.",
      "Nama di halaman profil sempat tercetak dua kali — sekali sebagai judul, sekali di dalam kartu. Sekarang sekali.",
      "Kotak “gabung dulu” tidak lagi mengambang di ruang kosong setinggi sepertiga layar.",
    ],
  },
  {
    date: "2026-08-11",
    version: "v3.1",
    title: "Huruf yang enak dibaca, menu bawah kembali, dan halaman Roadmap",
    tags: ["Tampilan", "Baru"],
    points: [
      "Teks isi materi tidak lagi memakai huruf piksel. Judul dan tombol tetap bergaya arcade, tapi paragraf yang kamu baca sekarang memakai huruf bawaan perangkatmu — lebih tajam, lebih cepat muncul, dan tidak perlu diunduh sama sekali.",
      "Menu bawah kembali di HP: empat tujuan yang paling sering dibuka plus tombol Menu untuk sisanya, semuanya dalam jangkauan jempol. Tombol menu pindah dari pojok kiri atas ke bar bawah.",
      "Halaman akun sekarang punya menu bawah yang sama, jadi cara berpindah halaman tidak berubah-ubah tergantung kamu sedang di mana.",
      "Halaman Roadmap baru: seluruh jalur belajar dalam satu peta, dari nol sampai menjalankan beberapa agent. Bisa dibuka tanpa akun dan bisa dibagikan.",
      "Peta belajar dan Roadmap sekarang ada di menu. Sebelumnya Peta belajar cuma bisa ditemukan lewat satu ajakan kecil yang bahkan tidak muncul di HTML awal — praktis tersembunyi.",
      "Halaman Peta belajar juga sempat tidak punya gambar pratinjau saat dibagikan. Sekarang punya.",
    ],
  },
  {
    date: "2026-08-11",
    version: "v3.0",
    title: "Sidebar, dan halaman berhenti “terbuka dua kali”",
    tags: ["Tampilan", "Perbaikan"],
    points: [
      "Kelihatan seperti halaman terbuka dua kali setiap kali kamu pindah menu — dan memang begitu: aplikasinya memainkan animasi masuk dua sampai tiga kali per satu ketukan. Di HP yang lambat itu 1,2 detik geseran tanpa henti, dan geseran yang di tengah tidak menampilkan perubahan apa pun. Animasi antar layar dicabut; sekarang pindah halaman langsung sampai.",
      "Bar tab di atas dan bar menu di bawah diganti satu sidebar. Di layar lebar ia menetap di kiri; di HP ia muncul dari samping lewat tombol menu, dan menutup sendiri begitu kamu memilih tujuan.",
      "Semua tujuan sekarang ada di satu daftar, jadi tidak ada lagi menu yang “ketutup” di balik tombol Lainnya. Menu yang tidak ada isinya tetap disembunyikan seperti sebelumnya.",
      "Tombol gabung memakai satu kata yang sama di mana-mana. Sebelumnya rak samping bilang “Gabung” sementara isi halaman bilang “Login untuk gabung” — dua nama untuk satu hal, kadang di layar yang sama.",
      "Halaman Diskusi dan daftar Komunitas sebelumnya tidak punya gambar pratinjau saat dibagikan. Sekarang punya.",
      "Halaman Peta belajar, sertifikat, dan halaman masuk sengaja tidak memakai sidebar — itu halaman yang dibuka orang sebelum bergabung, bukan ruang kerja anggota.",
    ],
  },
  {
    date: "2026-08-11",
    version: "v2.10",
    title: "Peta belajar: jawab beberapa kartu, dapat rencana belajarmu sendiri",
    tags: ["Baru", "Tampilan"],
    points: [
      "Buka /mulai. Beberapa kartu singkat — sudah berapa lama pakai AI, kerjanya apa, mau capai apa, sanggup keluar berapa per bulan, punya langganan atau tidak, dan istilah mana yang sudah kamu tahu — lalu kamu dapat rencana belajar yang disusun dari jawabanmu.",
      "Hasilnya bukan satu jalur, tapi dua sampai tiga pilihan berperingkat, masing-masing dengan alasan yang menyebut jawabanmu sendiri, kelas mana yang diambil lebih dulu, dan tiga langkah konkret untuk minggu ini.",
      "Pertanyaannya menyesuaikan. Kalau kamu baru mulai, kamu tidak akan pernah ditanya soal RAG atau fine-tuning — istilah yang cuma bikin orang merasa bodoh dan berhenti.",
      "Soal biaya dijawab jujur: kalau kamu pilih Rp0, rencananya benar-benar bisa dituntaskan dengan tier gratis, lengkap dengan batasnya. Kalau kamu sudah bayar ChatGPT Plus atau Claude Pro, sarannya menyesuaikan supaya yang sudah kamu bayar terpakai — dan kalau ternyata kamu tidak butuh langganan itu, kami bilang.",
      "Tidak perlu akun. Bisa dikerjakan sambil jalan, jawabannya tersimpan di HP-mu, dan rencananya bisa dibagikan lewat tautan.",
      "Pustaka Skills kini terisi 14 prompt siap pakai — balas email, notulen rapat, rapikan data, caption, review tulisan, dan lainnya.",
      "Tab yang tidak ada isinya untuk komunitasmu tidak lagi ditampilkan. Kalender hilang selama belum ada jadwal sesi; Skills hilang selama pustaka promptnya masih kosong. Alamatnya tetap hidup — tautan lama tidak rusak — hanya menunya yang berhenti menjanjikan halaman kosong.",
      "Karena ada slot yang kosong, Anggota kembali masuk ke bar bawah di HP untuk komunitas yang belum punya pustaka Skills. Urutannya ikut isi, bukan ditentukan sekali lalu dilupakan.",
      "Untuk pengelola: tab Statistik dirombak. Di atas ada denyut komunitas — berapa anggota yang aktif minggu ini, berapa yang menyelesaikan materi, dan berapa materi yang belum pernah dibuka sama sekali.",
      "Per kelas, ada peta “di mana orang berhenti”: daftar materi urut sesuai kelas, lengkap dengan berapa orang membacanya, berapa yang menyelesaikannya, dan berapa yang berhenti di antara dua materi. Materi dengan penurunan terbesar ditandai merah.",
      "Angka baca hanya menghitung anggota yang login, satu kali per materi per hari. Pengunjung anonim dan trafik dari Google tidak masuk hitungan — ini tertulis di layar supaya tidak salah dibaca sebagai jumlah pengunjung.",
    ],
  },
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
