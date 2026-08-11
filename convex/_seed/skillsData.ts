// Starter content for the SKILLS library: 14 copy-able prompts for belajar-ai.
//
// A skill is a materi with `kind: "skill"` + `promptText` (see _tables/learning.ts).
// The library shipped with working machinery and zero rows, so every community
// showed an empty shelf; this file is the shelf's first stock.
//
// ── HOUSE STYLE, AND WHY ─────────────────────────────────────────────────────
// Every prompt uses the SAME six-part skeleton the kelas "Prompt Engineering
// Praktis" teaches — PERAN / KONTEKS / TUGAS / FORMAT / BATASAN / BAHAN
// (materi "Enam bagian prompt yang bekerja" and "Membangun prompt andalanmu
// sendiri"). The library and the course therefore reinforce each other: a
// reader who copies a skill is reading a filled-in version of the template the
// course hands them empty, and a reader who finishes the course recognises the
// shape of every card here. Deviating per-skill would make the catalogue look
// like fourteen unrelated tricks instead of one method applied fourteen times.
//
// Placeholders are `[dalam kurung siku]` so "what must I change" is visible
// without reading the body, and every body answers the same three questions in
// the same order: kapan dipakai, apa yang wajib diganti, bagaimana gagalnya.
// The failure section is not decoration — a prompt shipped without its failure
// mode teaches people to trust output they should be checking.
//
// ORIGINAL TEXT. Nothing here is translated or adapted from roadmap.sh or any
// other all-rights-reserved source; the work situations are ordinary Indonesian
// office/UMKM work written from scratch for non-programmers.
//
// Prompts use FENCED blocks in the BODY (\`\`\`text) because
// slices/markdown/lib/parse.ts only recognises fences — an indented block
// renders as a mushed paragraph. `promptText` itself is raw, unfenced: the copy
// panel renders it verbatim.
//
// NOT placed in any course: placement is orthogonal to being a skill
// (DECISIONS #36). The writer is `upsertSkill` in ./seedSkills.ts.
//
// File length: pure Bahasa content copy — the category docs/rr-conventions.md
// exempts from the 200-LOC ceiling as `convex/_seed/**` course/data copy, and
// the `*Data.ts` name matches the exemption glob.
import type { SeedSkill } from "./seedSkills";

export const BELAJAR_AI_SKILLS: SeedSkill[] = [
  {
    slug: "balas-email-nada-tepat",
    title: "Balas email dengan nada yang tepat",
    tags: ["email", "komunikasi", "kerja"],
    promptText: `PERAN: Kamu staf kantor Indonesia yang terbiasa menulis email kerja: sopan, singkat, tidak berbunga-bunga.
KONTEKS: Aku menerima email di bawah ini dari [siapa pengirimnya dan hubungannya denganku]. Yang sebenarnya ingin aku sampaikan: [inti jawabanku, boleh berantakan].
TUGAS: Tulis satu balasan email yang siap kirim.
FORMAT: Subjek (kalau perlu diganti), sapaan, isi maksimal 5 kalimat, satu kalimat penutup berisi langkah berikutnya, lalu tanda tangan [namaku].
BATASAN: Nada [pilih: netral / hangat / tegas]. Bahasa Indonesia. Tanpa istilah asing yang ada padanannya, tanpa emoji, tanpa basa-basi "semoga email ini menemukan Anda dalam keadaan baik". Jangan menjanjikan tanggal, angka, atau persetujuan yang tidak aku tulis di atas.
BAHAN:
[tempel isi email yang mau dibalas di sini]`,
    contentMd: `## Kapan dipakai

Saat kamu tahu mau menjawab apa tapi buntu di kalimat pertama, dan saat email masuk bernada tidak enak sehingga jawaban spontanmu berisiko terlalu emosional.

## Yang wajib kamu ganti

- **Hubungan pengirim** — "atasan", "klien yang telat bayar", dan "vendor yang kita tinggalkan" menghasilkan tiga email yang sangat berbeda.
- **Inti jawaban.** Tulis apa adanya, boleh satu baris berantakan: "intinya nggak bisa minggu ini, bisanya tanggal 14". Bagian ini yang membuat balasan jadi balasanmu, bukan balasan template.
- **Nada.** "Tegas" bukan berarti kasar; ia berarti tanpa permintaan maaf yang tidak perlu.

## Kenapa batasannya panjang

Larangan "jangan menjanjikan tanggal, angka, atau persetujuan yang tidak aku tulis" adalah pengaman paling penting di prompt ini. Tanpa itu, AI gemar menambal email dengan janji yang terdengar enak — "kami akan segera menindaklanjuti dalam 1x24 jam" — dan kamu baru sadar setelah terkirim.

## Cara gagalnya

- **Terlalu manis.** Kalau hasilnya penuh "dengan senang hati kami", ganti nada jadi netral dan tambahkan batasan "maksimal 4 kalimat".
- **Mengarang konteks.** Ia bisa menyebut nomor invoice atau nama proyek yang tidak pernah ada. Baca ulang setiap angka dan nama sebelum kirim; itu bagianmu, bukan bagian AI.
- **Kaku seperti surat dinas.** Biasanya karena bahan yang kamu tempel juga kaku. Tambahkan satu contoh kalimat khas kamu di bagian BAHAN.

> Rangka enam bagian ini dijelaskan penuh di kelas **Prompt Engineering Praktis**, materi "Enam bagian prompt yang bekerja".`,
  },
  {
    slug: "ringkas-notulen-rapat",
    title: "Ringkas notulen rapat jadi keputusan dan tugas",
    tags: ["rapat", "notulen", "ringkasan", "produktivitas"],
    promptText: `PERAN: Kamu notulis rapat yang disiplin. Kamu hanya menulis yang benar-benar diucapkan.
KONTEKS: Ini catatan mentah rapat [nama rapat] tanggal [tanggal]. Pesertanya: [daftar nama]. Catatannya berantakan dan tidak berurutan.
TUGAS: Ubah jadi notulen yang bisa dibaca orang yang tidak ikut rapat.
FORMAT:
1. RINGKASAN — maksimal 3 kalimat.
2. KEPUTUSAN — daftar poin, satu keputusan satu baris.
3. TUGAS — tabel 3 kolom: Tugas | Penanggung jawab | Tenggat.
4. BELUM SELESAI — hal yang dibahas tapi tidak diputuskan.
BATASAN: Jangan menyimpulkan apa pun yang tidak terucap. Kalau penanggung jawab atau tenggat tidak disebut, tulis "belum ditentukan" — jangan menebak. Jangan menghaluskan perdebatan jadi kesepakatan. Bahasa Indonesia, tanpa istilah asing yang ada padanannya.
BAHAN:
[tempel catatan mentah atau transkrip di sini]`,
    contentMd: `## Kapan dipakai

Setelah rapat yang catatannya kamu ketik cepat-cepat, atau setelah menyalin transkrip otomatis dari aplikasi rapat. Paling terasa gunanya untuk rapat yang panjang tapi keputusannya sedikit.

## Yang wajib kamu ganti

- **Daftar peserta.** Tanpa itu, kolom "penanggung jawab" akan diisi jabatan karangan seperti "tim marketing".
- **Bahan.** Boleh transkrip mentah lengkap dengan "eee" dan potongan kalimat; justru itu yang paling cocok.

## Bagian yang paling berharga

Kolom **BELUM SELESAI**. Notulen buatan manusia biasanya menghilangkan bagian ini karena tidak enak ditulis, padahal itulah yang membuat rapat berikutnya tidak mengulang perdebatan yang sama.

## Cara gagalnya

- **Tenggat karangan.** Ini kegagalan paling sering dan paling berbahaya. Instruksi "tulis belum ditentukan" mengurangi banyak, tapi tetap periksa setiap tanggal yang muncul.
- **Perdebatan berubah jadi kesepakatan.** Kalau di rapat dua orang berbeda pendapat dan notulennya berbunyi "disepakati", buang hasilnya dan tambahkan di BATASAN: "kalau ada dua pendapat, tulis keduanya".
- **Transkrip terlalu panjang.** Kalau rapatnya dua jam, potong per bagian dan jalankan beberapa kali, lalu gabungkan sendiri hasilnya.`,
  },
  {
    slug: "rapikan-data-spreadsheet",
    title: "Rapikan data berantakan di spreadsheet",
    tags: ["data", "spreadsheet", "operasional", "kerja"],
    promptText: `PERAN: Kamu petugas administrasi yang teliti dan tidak pernah membuang baris data.
KONTEKS: Ini data dari [sumbernya: form pendaftaran / catatan penjualan / daftar kontak]. Isinya tidak seragam karena diketik banyak orang.
TUGAS: Bersihkan dan seragamkan.
ATURAN SERAGAM:
- Nama orang: Huruf Kapital Di Awal Kata.
- Nomor HP: format 08xxxxxxxxxx, hilangkan spasi, tanda hubung, dan +62 diganti 0.
- Tanggal: YYYY-MM-DD.
- Angka rupiah: angka polos tanpa "Rp" dan tanpa titik.
- Kolom kosong: tulis "-".
FORMAT: Kembalikan sebagai tabel dengan kolom yang sama persis seperti aslinya, ditambah satu kolom terakhir "CATATAN" yang berisi apa yang kamu ubah pada baris itu, atau "-" kalau tidak ada perubahan.
BATASAN: Jumlah baris keluar harus sama dengan jumlah baris masuk. Jangan menggabungkan, mengurutkan, atau menghapus baris. Kalau sebuah nilai meragukan (misal nomor HP hanya 6 digit), biarkan apa adanya dan tulis alasannya di kolom CATATAN.
BAHAN:
[tempel datanya di sini, satu baris per baris data]`,
    contentMd: `## Kapan dipakai

Data hasil form yang diisi puluhan orang: nomor HP ada yang pakai +62, ada yang pakai spasi, nama ada yang HURUF BESAR SEMUA, tanggal ada yang 3/5 dan ada yang 3 Mei. Merapikan 200 baris begini dengan tangan memakan satu sore.

## Yang wajib kamu ganti

- **Aturan seragam.** Daftar di prompt adalah kebiasaan umum Indonesia; kalau kantormu menyimpan nomor dengan format +62, ubah aturannya sekarang, bukan hasilnya nanti.
- **Bahan.** Salin langsung dari spreadsheet — hasil salinan antar sel akan terbaca sebagai kolom.

## Dua pengaman yang tidak boleh dihapus

1. **"Jumlah baris keluar harus sama dengan masuk."** Tanpa kalimat ini, baris yang dianggap duplikat bisa hilang diam-diam.
2. **Kolom CATATAN.** Ini yang membuat hasilnya bisa diperiksa. Urutkan kolom itu, baca yang tidak "-", selesai — kamu memeriksa 12 baris, bukan 200.

## Cara gagalnya

- **Diam-diam memotong.** Untuk data panjang, AI kerap berhenti di tengah dan menutup dengan "…dan seterusnya". Hitung barisnya. Kalau kurang, potong jadi bagian 50 baris.
- **Mengubah angka.** Ia pernah "membetulkan" harga 45000 jadi 45.000,00. Kolom CATATAN akan menunjukkannya — kalau kamu membacanya.
- **Data pribadi.** Jangan tempel KTP, NIK, atau nomor rekening ke layanan mana pun. Hapus kolom itu dulu, rapikan sisanya.`,
  },
  {
    slug: "caption-instagram-tidak-generik",
    title: "Bikin caption yang tidak terdengar seperti robot",
    tags: ["konten", "media-sosial", "caption"],
    promptText: `PERAN: Kamu penulis konten yang paham pembeli Indonesia dan benci kalimat promosi kosong.
KONTEKS: Aku menjual [produk/jasa] seharga [harga]. Pembeliku [siapa mereka, umur, kota, kebiasaan]. Yang paling sering mereka tanyakan sebelum beli: [pertanyaan/keberatan mereka]. Yang membedakan aku dari penjual lain: [satu hal konkret].
TUGAS: Tulis 5 caption untuk [Instagram / TikTok / Facebook], masing-masing dengan sudut pandang berbeda: (1) menjawab keberatan itu, (2) cerita satu pelanggan, (3) fakta atau angka, (4) di balik layar, (5) ajakan langsung.
FORMAT: Tiap caption maksimal 3 kalimat. Kalimat pertama harus bisa berdiri sendiri sebagai pembuka. Kalimat terakhir mengajak melakukan satu hal: [chat WA / klik tautan di bio / komentar].
BATASAN: Bahasa Indonesia sehari-hari, boleh santai tapi bukan alay. Tanpa emoji, tanpa tagar, tanpa kata "solusi", "revolusioner", "wajib punya", "dijamin". Jangan mengarang testimoni atau klaim yang tidak aku sebutkan di atas.
BAHAN:
[kalau ada, tempel caption lamamu yang hasilnya bagus sebagai contoh gaya]`,
    contentMd: `## Kapan dipakai

Saat kamu harus mengisi jadwal unggahan dan semua idemu terdengar sama. Lima sudut pandang sekaligus lebih berguna daripada satu caption "terbaik": kamu memilih, bukan menerima.

## Yang wajib kamu ganti

- **Keberatan pembeli.** Ini bahan paling berharga di seluruh prompt dan bagian yang paling sering dikosongkan orang. "Takut ukurannya tidak muat" menghasilkan caption yang jauh lebih tajam daripada deskripsi produk apa pun.
- **Satu hal konkret yang membedakan.** "Kualitas terbaik" bukan pembeda. "Dikirim hari yang sama kalau pesan sebelum jam 2" adalah pembeda.
- **Contoh gaya.** Menempelkan satu caption lamamu yang berhasil mengubah hasilnya lebih banyak daripada instruksi gaya apa pun — ini few-shot, dan kelas Prompt Engineering membahasnya di materi "Contoh yang benar".

## Cara gagalnya

- **Semua caption terdengar sama.** Berarti konteksmu terlalu tipis. Tambahkan pertanyaan yang sungguhan pernah masuk ke DM-mu.
- **Mengarang testimoni.** Sudut pandang "cerita satu pelanggan" adalah jebakan: kalau kamu tidak menyediakan ceritanya, ia akan mengarang. Isi sendiri atau hapus sudut pandang itu.
- **Terlalu banyak tanda seru.** Tambahkan ke BATASAN: "maksimal satu tanda seru untuk kelima caption".`,
  },
  {
    slug: "review-tulisan-sebelum-kirim",
    title: "Review tulisanmu sebelum dikirim",
    tags: ["menulis", "editing", "bahasa"],
    promptText: `PERAN: Kamu editor bahasa Indonesia yang galak tapi adil. Tugasmu menunjukkan masalah, bukan menulis ulang.
KONTEKS: Tulisan di bawah akan dibaca oleh [siapa pembacanya] dan tujuannya membuat mereka [melakukan apa]. Nada yang aku mau: [formal / santai / netral].
TUGAS: Periksa tulisan ini, jangan menulis ulang.
FORMAT:
1. PENILAIAN — 2 kalimat: apakah tujuannya tercapai.
2. MASALAH — maksimal 7 poin, diurutkan dari yang paling merugikan. Tiap poin: kutip kalimat aslinya, sebut masalahnya, beri satu usulan perbaikan.
3. SATU HAL — kalau aku cuma sempat memperbaiki satu hal, mana.
BATASAN: Jangan mengembalikan versi utuh yang sudah diperbaiki. Jangan memuji tanpa alasan. Bedakan mana yang salah (ejaan, tata bahasa, fakta janggal) dan mana yang selera. Kalau tulisannya sudah baik, katakan dan berhenti — jangan mencari-cari masalah.
BAHAN:
[tempel tulisanmu di sini]`,
    contentMd: `## Kapan dipakai

Sebelum mengirim lamaran, proposal, pengumuman ke pelanggan, atau apa pun yang tidak bisa ditarik kembali.

## Kenapa "jangan menulis ulang"

Kalau kamu minta versi perbaikan, kamu akan mengirim tulisan AI dan berhenti belajar. Kalau kamu minta daftar masalah, kamu memperbaiki sendiri dan kesalahan yang sama tidak terulang bulan depan. Itu sebabnya larangan itu ada di BATASAN dan bukan sekadar saran.

## Yang wajib kamu ganti

- **Siapa pembacanya dan apa yang kamu mau mereka lakukan.** Tanpa dua hal ini, "review" hanya jadi koreksi ejaan.
- **Nada.** Editor tidak bisa menilai "terlalu santai" kalau tidak tahu targetnya.

## Cara gagalnya

- **Tetap mengembalikan versi jadi.** Tegaskan lagi: "hanya daftar masalah, jangan tulis ulang satu paragraf pun".
- **Sopan berlebihan.** Kalau semua poin berbunyi "sudah bagus, mungkin bisa ditambah sedikit", ganti perannya jadi "editor yang harus menolak 9 dari 10 naskah".
- **Menyamakan selera dengan kesalahan.** Kamu yang memutuskan. Poin bertanda selera boleh kamu abaikan tanpa rasa bersalah.`,
  },
  {
    slug: "bikin-soal-latihan",
    title: "Bikin soal latihan dari materi apa pun",
    tags: ["mengajar", "edukasi", "kuis"],
    promptText: `PERAN: Kamu guru yang menyusun soal untuk mengukur pemahaman, bukan hafalan.
KONTEKS: Materi di bawah untuk [siapa yang belajar: siswa SMA / karyawan baru / anggota komunitas]. Mereka sudah tahu [pengetahuan awal mereka]. Yang paling penting mereka kuasai: [1-3 hal inti].
TUGAS: Buat [jumlah] soal latihan.
FORMAT: Untuk tiap soal — nomor, pertanyaan, 4 pilihan jawaban (A-D), jawaban benar, dan satu kalimat penjelasan KENAPA pilihan yang salah itu salah. Setelah semua soal, tulis satu kolom "kunci jawaban" terpisah.
BATASAN: Semua jawaban harus bisa ditemukan atau disimpulkan dari bahan di bawah — jangan pakai pengetahuan luar. Pilihan yang salah harus masuk akal, bukan lelucon. Jangan pakai "semua benar" atau "semua salah". Hindari pertanyaan yang jawabannya cuma mengulang kalimat di materi.
BAHAN:
[tempel materinya di sini]`,
    contentMd: `## Kapan dipakai

Menyiapkan kuis pelatihan, latihan untuk anggota komunitas, atau soal ulangan dari materi yang sudah kamu tulis. Berguna juga untuk dirimu sendiri: menjawab soal tentang bacaan menunjukkan bagian mana yang sebenarnya belum kamu pahami.

## Yang wajib kamu ganti

- **Siapa yang belajar dan apa yang sudah mereka tahu.** Soal untuk karyawan baru dan untuk siswa SMA berbeda bukan pada kesulitannya, tapi pada contohnya.
- **1-3 hal inti.** Tanpa ini, soalnya akan menyebar ke detail sepele yang kebetulan mudah dijadikan pertanyaan.

## Bagian yang membuatnya berguna

Permintaan **penjelasan kenapa pilihan salah itu salah**. Itu memaksa pengecoh yang masuk akal, dan sekaligus memberimu bahan pembahasan tanpa kerja tambahan.

## Cara gagalnya

- **Pengecoh yang konyol.** Kalau tiga pilihan jelas ngawur, soalnya tidak mengukur apa pun. Tambahkan: "setiap pengecoh harus mewakili satu kesalahpahaman yang sungguh sering terjadi".
- **Soal hafalan kalimat.** Ciri-cirinya: jawabannya bisa ditemukan dengan mencocokkan kata. Minta "minimal separuh soal berupa penerapan pada situasi baru".
- **Kunci jawaban keliru.** Jarang, tapi terjadi. Kerjakan sendiri soalnya sekali sebelum dibagikan.`,
  },
  {
    slug: "terjemah-tidak-kaku",
    title: "Terjemah Inggris–Indonesia yang tidak kaku",
    tags: ["terjemahan", "bahasa", "menulis"],
    promptText: `PERAN: Kamu penerjemah Inggris-Indonesia yang menerjemahkan maksud, bukan kata per kata.
KONTEKS: Teks ini akan dibaca [siapa pembacanya] dalam bentuk [artikel / caption / email / dokumen kerja]. Bidangnya [bidangnya].
TUGAS: Terjemahkan ke bahasa Indonesia yang enak dibaca.
FORMAT: Terjemahan lengkap dulu. Setelah itu, bagian "CATATAN PENERJEMAH": daftar istilah yang kamu biarkan dalam bahasa Inggris beserta alasannya, dan bagian yang punya lebih dari satu tafsiran.
BATASAN: Boleh mengubah susunan kalimat supaya wajar dalam bahasa Indonesia. Istilah teknis yang lebih dikenal dalam bahasa Inggris biarkan apa adanya — jangan memaksakan padanan yang tidak dipakai orang. Jangan menambah atau menghilangkan informasi. Pertahankan nada aslinya: kalau aslinya santai, jangan jadi formal.
BAHAN:
[tempel teks Inggrisnya di sini]`,
    contentMd: `## Kapan dipakai

Menerjemahkan artikel, dokumentasi, atau pesan kerja yang hasil mesin penerjemah otomatisnya terbaca kaku dan aneh.

## Yang wajib kamu ganti

- **Bentuk dan pembaca.** Caption dan dokumen kerja butuh dua bahasa Indonesia yang berbeda.
- **Bidang.** Kata *engagement* di pemasaran, di HRD, dan di teknik adalah tiga hal berbeda. Bidang inilah yang mencegah salah pilih.

## Kenapa ada catatan penerjemah

Bagian yang paling sering salah bukan kalimat panjang, tapi satu istilah yang punya dua arti. Dengan meminta daftar istilah dan bagian yang bermakna ganda, kamu tahu persis di mana harus memeriksa — alih-alih membaca ulang semuanya dengan curiga.

## Cara gagalnya

- **Terlalu bersemangat mencari padanan.** Kalau *deadline* jadi "tenggat waktu penyelesaian akhir", tegaskan: "istilah yang sudah lazim dipakai orang Indonesia biarkan".
- **Nada berubah jadi formal.** Bahasa Indonesia tulis memang cenderung formal. Beri satu contoh kalimat bergaya yang kamu mau di bagian BAHAN.
- **Diam-diam merapikan isi.** Terjemahan yang "lebih rapi dari aslinya" biasanya sudah kehilangan sesuatu. Bandingkan panjang paragrafnya.`,
  },
  {
    slug: "rencana-konten-mingguan",
    title: "Susun rencana konten satu minggu",
    tags: ["konten", "perencanaan", "media-sosial"],
    promptText: `PERAN: Kamu perencana konten yang realistis dan tahu pembuat kontennya cuma satu orang.
KONTEKS: Akun [nama akun] di [platform] membahas [topik]. Pengikutnya [siapa mereka]. Tujuanku bulan ini: [tujuan konkret, misal 20 chat WA masuk]. Waktu yang benar-benar aku punya: [jam per minggu]. Alat yang aku punya: [HP saja / HP + kamera / dll].
TUGAS: Susun rencana konten 7 hari.
FORMAT: Tabel dengan kolom: Hari | Format (foto/video/teks) | Judul atau kail pembuka | Isi pokok 1 kalimat | Ajakan | Perkiraan waktu pengerjaan. Di bawah tabel, tulis "BAHAN YANG HARUS DISIAPKAN" berupa daftar belanja bahan (foto apa saja, data apa saja) supaya semua bisa dikerjakan dalam satu hari produksi.
BATASAN: Total waktu pengerjaan tidak boleh melebihi jam yang aku sebutkan. Maksimal 2 unggahan berupa jualan langsung. Jangan menyarankan ikut tren yang perlu alat atau orang tambahan. Bahasa Indonesia.
BAHAN:
[kalau ada, tempel judul 5 konten lamamu yang paling ramai]`,
    contentMd: `## Kapan dipakai

Hari Minggu malam, saat kamu tahu harus mengunggah sesuatu minggu ini tapi belum tahu apa. Juga saat kamu sudah lelah karena tiap hari memikirkan ide dari nol.

## Yang wajib kamu ganti

- **Jam yang benar-benar kamu punya.** Ini batasan yang membuat rencananya bisa dijalankan. Isi jujur — kalau cuma 3 jam, tulis 3.
- **Tujuan konkret.** "Naikkan awareness" menghasilkan rencana yang tidak bisa dinilai. "20 chat WA masuk" menghasilkan rencana dengan ajakan yang jelas.
- **Lima konten lamamu yang paling ramai.** Ini memberi tahu apa yang sudah terbukti disukai pengikutmu.

## Bagian yang sering dilewatkan orang

Daftar **BAHAN YANG HARUS DISIAPKAN**. Rencana konten gagal bukan karena idenya habis, tapi karena hari Rabu kamu sadar butuh foto yang belum diambil. Daftar itu mengubah tujuh hari kerja jadi satu hari produksi.

## Cara gagalnya

- **Rencana untuk tim lima orang.** Kalau muncul "buat video sinematik dengan pencahayaan tiga titik", batasan alatmu belum kamu tulis.
- **Semuanya jualan.** Batas maksimal 2 unggahan jualan ada karena alasan ini.
- **Kail pembuka yang sama tujuh kali.** Tambahkan: "tujuh kail pembuka harus beda bentuk — pertanyaan, angka, cerita, dan seterusnya".`,
  },
  {
    slug: "analisis-keluhan-pelanggan",
    title: "Kelompokkan keluhan pelanggan jadi pola",
    tags: ["layanan-pelanggan", "analisis", "data"],
    promptText: `PERAN: Kamu analis layanan pelanggan yang mencari pola, bukan mengumpulkan kutipan.
KONTEKS: Ini [jumlah] keluhan/masukan pelanggan [usahaku] yang masuk lewat [WA / ulasan marketplace / form] selama [rentang waktu].
TUGAS: Kelompokkan jadi tema, lalu urutkan berdasarkan kerugian yang ditimbulkan — bukan berdasarkan jumlah.
FORMAT:
1. TABEL: Tema | Jumlah keluhan | Contoh kutipan (1, apa adanya) | Dugaan penyebab | Perbaikan yang bisa dikerjakan minggu ini.
2. TIGA PALING MENDESAK — beserta alasan kenapa mendesak.
3. YANG BUKAN MASALAH KITA — keluhan di luar kendali kita (misal keterlambatan kurir), dipisahkan supaya tidak mengaburkan yang lain.
BATASAN: Jangan menyimpulkan sebab yang tidak didukung isi keluhan — tandai dugaan sebagai "dugaan". Jangan menghaluskan bahasa pelanggan pada kutipan; salin apa adanya. Kalau satu keluhan menyinggung dua tema, hitung di keduanya dan sebutkan.
BAHAN:
[tempel keluhannya, satu per baris]`,
    contentMd: `## Kapan dipakai

Saat kamu punya tumpukan chat, ulasan bintang satu, atau isian form yang tidak pernah sempat dibaca ulang. Membacanya satu per satu memberi perasaan; mengelompokkannya memberi keputusan.

## Yang wajib kamu ganti

- **Sumber dan rentang waktu.** Ulasan marketplace dan chat WA punya nada berbeda; tanpa rentang waktu kamu tidak tahu apakah masalahnya masih berlangsung.
- **Bahan.** Sertakan yang positif juga, bukan hanya keluhan — pola yang muncul jadi lebih jujur.

## Kenapa diurutkan berdasar kerugian, bukan jumlah

Sepuluh keluhan "pengiriman lama" mungkin kalah penting dibanding dua keluhan "barang datang rusak", karena yang kedua mengembalikan uang dan menghilangkan pelanggan selamanya. Mengurutkan berdasarkan jumlah membuatmu memperbaiki yang paling berisik, bukan yang paling mahal.

## Cara gagalnya

- **Tema terlalu umum.** "Pelayanan" bukan tema yang bisa ditindaklanjuti. Minta: "setiap tema harus cukup spesifik untuk ditugaskan ke satu orang".
- **Dugaan sebab yang terdengar meyakinkan.** Karena itu ada penanda "dugaan". Perlakukan sebagai hipotesis yang perlu kamu cek sendiri.
- **Kutipan yang sudah dipoles.** Kalau kutipan terbaca terlalu rapi, itu sudah bukan suara pelanggan. Cocokkan dengan bahan aslinya.
- **Data pribadi.** Hapus nama, nomor HP, dan alamat sebelum menempel.`,
  },
  {
    slug: "tulis-sop-dari-kebiasaan",
    title: "Tulis SOP dari cara kerja yang selama ini cuma di kepala",
    tags: ["sop", "operasional", "kerja"],
    promptText: `PERAN: Kamu penyusun prosedur kerja. Pembacamu adalah karyawan baru hari pertama yang tidak boleh bertanya kepada siapa pun.
KONTEKS: Pekerjaan ini bernama [nama pekerjaan], dikerjakan [seberapa sering], oleh [jabatan]. Alat yang dipakai: [aplikasi/alat]. Kalau salah, akibatnya: [akibat kesalahan].
TUGAS: Ubah penjelasanku yang berantakan di bawah menjadi SOP yang bisa diikuti tanpa bertanya.
FORMAT:
1. TUJUAN — 1 kalimat.
2. KAPAN DIJALANKAN — pemicunya.
3. YANG DIBUTUHKAN — akses, alat, berkas.
4. LANGKAH — bernomor, satu langkah satu tindakan, diawali kata kerja.
5. CARA TAHU SUDAH BENAR — tanda keberhasilan tiap langkah penting.
6. KALAU BERMASALAH — 3 masalah tersering dan tindakannya.
7. PERTANYAAN YANG BELUM TERJAWAB — hal yang tidak aku jelaskan tapi seharusnya ada di SOP ini.
BATASAN: Jangan mengarang langkah yang tidak aku sebutkan — masukkan ke bagian 7. Satu langkah maksimal 2 kalimat. Bahasa Indonesia sederhana, tanpa istilah asing yang tidak dipakai di kantor.
BAHAN:
[ceritakan cara kerjamu apa adanya, tidak perlu urut]`,
    contentMd: `## Kapan dipakai

Saat kamu satu-satunya yang tahu cara melakukan sesuatu, dan itu mulai berbahaya: mau cuti, mau merekrut, atau baru saja salah karena lupa satu langkah.

## Cara mengisi bagian BAHAN

Jangan mencoba menulis rapi. Ceritakan saja seperti sedang menjelaskan lewat pesan suara: "biasanya aku buka dulu... oh iya sebelum itu harus cek...". Prompt ini memang dibuat untuk masukan yang tidak berurutan — itu justru bahan terbaiknya.

## Bagian yang paling berguna

Nomor 7, **PERTANYAAN YANG BELUM TERJAWAB**. Bagian yang kamu lupakan adalah bagian yang paling sudah kamu hafal, dan justru itu yang membuat karyawan baru tersangkut. Daftar itu adalah daftar tugasmu untuk menyempurnakan SOP-nya.

## Cara gagalnya

- **Langkah karangan yang terdengar profesional.** Ciri khasnya: muncul "lakukan verifikasi berjenjang" padahal di tempatmu tidak ada. Semua yang tidak kamu sebutkan harus turun ke bagian 7 — kalau melanggar, tegaskan ulang.
- **Langkah terlalu besar.** "Proses pesanan" bukan langkah, itu seluruh pekerjaan. Minta pemecahan sampai satu langkah = satu klik atau satu tindakan.
- **SOP yang benar tapi tidak pernah dibaca.** Uji sekali: minta orang lain menjalankannya tanpa bertanya, dan catat di mana dia berhenti.`,
  },
  {
    slug: "cek-fakta-sebuah-klaim",
    title: "Cek sebuah klaim sebelum ikut menyebarkan",
    tags: ["cek-fakta", "riset", "literasi-digital"],
    promptText: `PERAN: Kamu pemeriksa fakta yang berhati-hati dan berani berkata "saya tidak tahu".
KONTEKS: Aku menerima klaim di bawah lewat [WhatsApp / media sosial / obrolan kantor]. Aku belum tahu benar atau salah dan tidak mau ikut menyebarkan kalau keliru.
TUGAS: Bantu aku menilainya — JANGAN memvonis benar atau salah.
FORMAT:
1. KLAIM SEBENARNYA — tulis ulang klaimnya jadi 1 kalimat yang bisa diuji. Kalau ada beberapa klaim, pisahkan.
2. YANG PERLU BENAR AGAR KLAIM INI BENAR — daftar syaratnya.
3. TANDA BAHAYA — ciri kabar bohong yang ada pada teks ini (mendesak, tanpa sumber, angka bulat mencurigakan, membangkitkan amarah, dan lain-lain).
4. CARA MEMERIKSA SENDIRI — 3-5 langkah konkret: kata kunci apa yang harus aku cari, lembaga atau situs resmi mana yang berwenang soal ini, dan bukti seperti apa yang akan menyelesaikan perdebatan.
5. TINGKAT KEYAKINANMU — dan sebutkan apa yang kamu tidak tahu.
BATASAN: Kamu tidak punya akses internet dan pengetahuanmu ada batas waktunya, jadi jangan menyebut sumber, tautan, atau angka seolah-olah kamu baru mengeceknya — itu karangan. Nyatakan dengan jelas mana yang kamu ketahui dan mana yang perlu aku cek sendiri.
BAHAN:
[tempel pesan atau klaimnya di sini]`,
    contentMd: `## Kapan dipakai

Setiap kali kamu hampir meneruskan pesan berantai, dan setiap kali sebuah angka di media sosial terdengar terlalu pas untuk jadi kebetulan.

## Kenapa prompt ini justru melarang AI menjawab "benar/salah"

Karena di sinilah AI paling sering salah dan paling terdengar meyakinkan. Model bahasa menghasilkan kalimat yang mirip kalimat benar; ia tidak sedang membuka situs mana pun. Klaim yang dibantah dengan sumber karangan lebih merusak daripada klaim yang dibiarkan.

Maka yang diminta di sini bukan vonis, melainkan **kerangka pemeriksaan**: apa yang perlu benar, ke mana harus mencari, bukti apa yang menyelesaikan. Itu pekerjaan yang memang bisa dilakukan AI dengan andal.

## Yang wajib kamu ganti

- **Bahan** — tempel apa adanya, termasuk huruf besar semua dan tanda serunya. Gaya penulisannya adalah bukti.

## Cara gagalnya

- **Tautan dan nomor peraturan karangan.** Ini kegagalan nomor satu. Kalau muncul tautan, jangan percaya; buka sendiri lewat pencarian.
- **Terlalu percaya diri.** Kalau tingkat keyakinannya "tinggi" tanpa menyebut apa pun yang ia tidak tahu, minta ulang bagian 5.
- **Klaim yang lebih baru dari batas pengetahuannya.** Untuk kabar minggu ini, langkah 4 adalah satu-satunya bagian yang berguna. Pakai itu, lalu periksa sendiri.

> Bahaya karangan ini dibahas di kelas **Prompt Engineering Praktis**, materi "Menghindari halusinasi".`,
  },
  {
    slug: "latihan-wawancara-kerja",
    title: "Latihan wawancara kerja dengan pewawancara galak",
    tags: ["karier", "wawancara", "latihan"],
    promptText: `PERAN: Kamu pewawancara di [nama/jenis perusahaan] yang sudah mewawancarai ratusan orang, sopan tapi tidak mudah puas. Kamu selalu menggali jawaban yang mengambang.
KONTEKS: Aku melamar posisi [posisi]. Pengalamanku: [ringkasan singkat]. Kelemahan lamaranku yang aku sadari: [misal belum pernah memimpin tim / pindah kerja terlalu sering]. Lowongannya menekankan: [3 hal dari iklan lowongan].
TUGAS: Wawancarai aku.
ATURAN MAIN:
- Ajukan SATU pertanyaan, lalu berhenti dan tunggu jawabanku. Jangan pernah memberi daftar pertanyaan sekaligus.
- Setelah aku menjawab, ajukan satu pertanyaan lanjutan yang menggali bagian paling lemah dari jawabanku.
- Setelah 8 pertanyaan, hentikan wawancara dan beri penilaian.
FORMAT PENILAIAN: (1) kesan pertama, (2) jawaban terkuat dan kenapa, (3) tiga jawaban terlemah beserta versi yang lebih baik dalam bentuk poin — bukan naskah, (4) satu hal yang harus aku perbaiki sebelum wawancara sungguhan.
BATASAN: Jangan menilai atau memuji di tengah wawancara. Jangan menulis jawaban untukku. Bahasa Indonesia. Pertanyaan harus khas posisi ini, bukan pertanyaan umum yang bisa dipakai untuk semua lowongan.
MULAI: ajukan pertanyaan pertama sekarang.`,
    contentMd: `## Kapan dipakai

H-3 wawancara. Bukan untuk menghafal jawaban, tapi untuk mendengar dirimu sendiri menjawab pertanyaan yang tidak enak, sebelum orang sungguhan yang menanyakannya.

## Yang wajib kamu ganti

- **Kelemahan lamaran yang kamu sadari.** Bagian tersulit ditulis dan bagian paling berguna. Kalau kamu tidak menyebutkannya, latihannya jadi terlalu nyaman dan pertanyaan yang sebenarnya kamu takuti tidak akan pernah muncul.
- **Tiga penekanan dari iklan lowongan.** Ini yang membedakan latihan ini dari daftar "50 pertanyaan wawancara" yang beredar di mana-mana.

## Yang membuat prompt ini bekerja

Aturan "**satu pertanyaan, lalu berhenti**". Tanpa itu, AI mengeluarkan sepuluh pertanyaan sekaligus dan kamu kembali membaca daftar, bukan berlatih. Ini juga alasan prompt ini ditutup dengan "MULAI" — supaya ia langsung masuk peran, bukan menjelaskan rencananya dulu.

## Cara gagalnya

- **Bocor dari peran.** Kalau ia mulai memuji "jawaban Anda bagus sekali" di tengah, ingatkan: "lanjutkan wawancara, penilaian nanti di akhir".
- **Pertanyaan generik.** Berarti konteks posisinya terlalu tipis. Tempel bagian "kualifikasi" dari iklan lowongannya apa adanya.
- **Perbaikan berupa naskah hafalan.** Kamu tidak boleh menghafal jawaban AI — wawancara sungguhan akan langsung terdengar palsu. Itu sebabnya penilaian diminta dalam bentuk poin.`,
  },
  {
    slug: "balas-chat-calon-pembeli",
    title: "Balas chat calon pembeli yang cuma tanya harga",
    tags: ["penjualan", "whatsapp", "layanan-pelanggan", "komunikasi"],
    promptText: `PERAN: Kamu penjual berpengalaman lewat WhatsApp: ramah, cepat, tidak memaksa, dan tidak pernah membalas dengan paragraf panjang.
KONTEKS: Aku menjual [produk] harga [harga], [informasi penting: stok, ongkir, waktu kirim, cara bayar]. Calon pembeli ini mengirim: "[chat mereka]". Yang biasanya bikin mereka batal: [alasan batal tersering].
TUGAS: Tulis 3 pilihan balasan dengan pendekatan berbeda: (1) langsung jawab lalu satu pertanyaan balik, (2) jawab sambil menyebut satu hal yang membedakan produkku, (3) singkat sekali untuk pembeli yang buru-buru.
FORMAT: Tiap balasan maksimal 4 baris pendek gaya chat, bukan paragraf. Setiap balasan diakhiri dengan satu pertanyaan yang mudah dijawab.
BATASAN: Bahasa Indonesia percakapan, sapaan "Kak". Jangan mengarang stok, diskon, atau janji waktu kirim yang tidak aku sebutkan. Tanpa istilah asing, tanpa huruf kapital semua, maksimal satu emoji per balasan. Jangan meminta maaf tanpa alasan.
BAHAN:
[kalau ada, tempel contoh chat penjualanmu yang berakhir dengan pembelian]`,
    contentMd: `## Kapan dipakai

Saat masuk chat "berapa kak?" dan kamu tahu, kalau balasannya cuma angka, obrolannya berhenti di situ.

## Yang wajib kamu ganti

- **Alasan batal tersering.** Ini kunci prompt ini. Kalau orang biasanya batal karena ongkir, balasan yang baik menyebut ongkir sebelum ditanya.
- **Informasi penting.** Semua yang tidak kamu tulis akan ditebak atau dikarang — dan janji "dikirim hari ini juga" yang tidak bisa kamu tepati lebih mahal daripada satu penjualan.
- **Contoh chat yang berhasil.** Satu potongan saja cukup untuk membuat gayanya jadi gayamu.

## Kenapa tiga pilihan, bukan satu

Karena kamu yang tahu siapa yang sedang mengetik di seberang. Tiga pilihan membuat prompt ini tetap alat bantu, bukan pengganti — dan kamu jadi punya perbandingan mana pendekatan yang paling sering membuahkan pesanan.

## Cara gagalnya

- **Terlalu panjang.** Kalau hasilnya paragraf, pertegas: "maksimal 4 baris, gaya chat, tekan enter tiap kalimat".
- **Kesan mendesak yang dibuat-buat.** Kalimat seperti "stok tinggal 2, buruan kak" merusak kepercayaan kalau tidak benar. Tambahkan larangannya kalau perlu.
- **Kehilangan suaramu.** Pelangganmu mengenali caramu menulis. Rawat satu contoh chat-mu sendiri di prompt ini dan perbarui sesekali.`,
  },
  {
    slug: "dokumen-jadi-bahan-presentasi",
    title: "Ubah dokumen panjang jadi bahan presentasi",
    tags: ["presentasi", "ringkasan", "kerja"],
    promptText: `PERAN: Kamu penyusun materi presentasi yang tahu bahwa slide dibaca dalam 10 detik, bukan dipelajari.
KONTEKS: Dokumen di bawah akan aku presentasikan ke [siapa audiensnya] selama [durasi] menit. Yang aku mau mereka putuskan atau lakukan setelah presentasi: [keputusan yang aku kejar]. Yang sudah mereka ketahui: [pengetahuan awal mereka].
TUGAS: Ubah jadi kerangka slide.
FORMAT: Untuk tiap slide — nomor, judul slide (kalimat berisi maksud, bukan sekadar label), maksimal 3 poin isi, dan baris "yang aku ucapkan" berisi 2 kalimat yang tidak tertulis di slide. Di akhir, satu slide penutup berisi permintaan yang jelas, dan daftar "PERTANYAAN YANG MUNGKIN MUNCUL" beserta jawaban singkatnya.
BATASAN: Jumlah slide maksimal [durasi dibagi 2]. Jangan memindahkan kalimat panjang dari dokumen ke slide. Semua angka harus berasal dari dokumen — jangan menambah angka baru. Bahasa Indonesia.
BAHAN:
[tempel dokumen atau laporannya di sini]`,
    contentMd: `## Kapan dipakai

Ada laporan, proposal, atau hasil riset yang sudah selesai, dan besok kamu harus mempresentasikannya. Juga saat slide-mu sudah jadi tapi terlalu penuh.

## Yang wajib kamu ganti

- **Keputusan yang kamu kejar.** Presentasi tanpa permintaan yang jelas hanyalah pembacaan dokumen dengan suara keras. Bagian ini yang menentukan slide penutupnya.
- **Durasi.** Batas jumlah slide diturunkan dari sini, dan batas itulah yang memaksa pemilihan.
- **Pengetahuan awal audiens.** Menentukan berapa banyak latar belakang yang boleh dipangkas.

## Dua bagian yang jarang diminta orang

- **"Yang aku ucapkan"** — memisahkan slide dari naskah adalah cara paling cepat membuat slide berhenti jadi dinding teks.
- **"Pertanyaan yang mungkin muncul"** — nilainya sering melebihi slide-nya sendiri, terutama untuk presentasi ke atasan.

## Cara gagalnya

- **Judul berupa label.** "Latar Belakang" tidak memberi tahu apa pun. Minta setiap judul berbentuk kalimat: "Biaya pengiriman naik 30% sejak Maret".
- **Angka baru bermunculan.** Cocokkan setiap angka dengan dokumen aslinya sebelum masuk slide — kesalahan angka di depan atasan mahal harganya.
- **Slide terlalu banyak.** Kalau tetap melebihi batas, tegaskan jumlah maksimalnya dan minta ia menyebut apa yang dibuang.`,
  },
];
