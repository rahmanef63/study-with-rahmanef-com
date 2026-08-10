// Kurikulum "Portofolio yang Dilirik" (komunitas karier-digital) — DATA saja.
//
// Dipindah keluar dari `communityKarierDigital.ts` karena kelas ini tumbuh dari
// 2 jadi 10 materi: berkas copy Bahasa Indonesia yang panjang hanya bebas dari
// plafon 200 LOC di glob `convex/_seed/*Data.ts` (docs/rr-conventions.md,
// "File modularity"). Berkas komunitas kembali jadi rakitan tipis.
//
// DUA MATERI PERTAMA DISALIN PERSIS, judul maupun isi. Slug produksi diturunkan
// dari JUDUL dan probe idempoten di `_seed/curriculum.ts` mencarinya lewat judul
// yang sama, jadi mengubah judul = baris baru, dan mengubah isi = kode mati
// (upsert tidak pernah menulis ulang baris yang sudah ada). Materi baru
// DITAMBAHKAN di ekor supaya urutan bacanya tetap masuk akal saat mendarat di
// belakang high-water mark `courseLessons`.
import type { SeedCurriculum } from "./curriculum";

export const KARIER_PORTOFOLIO_CURRICULUM: SeedCurriculum = {
  slug: "portofolio-dilirik",
  title: "Portofolio yang Dilirik",
  description: "Susun portofolio yang bikin recruiter & klien berhenti scroll.",
  lessons: [
    {
      title: "Portofolio mengalahkan CV",
      contentMd: `## Kenapa portofolio menang

CV cuma klaim; portofolio itu **bukti**. Recruiter & klien percaya yang bisa mereka lihat.

- Tunjukkan hasil nyata, bukan daftar skill.
- 3 proyek fokus > 10 proyek asal.

## Belum punya proyek?

Bikin proyek latihan yang menyelesaikan masalah nyata — redesign, studi kasus, atau otomasi kecil.`,
    },
    {
      title: "3 proyek yang wajib ada",
      contentMd: `## Formula 3 proyek

1. **Proyek unggulan** — paling niche, paling dalam.
2. **Proyek proses** — tunjukkan cara berpikirmu (before → after).
3. **Proyek kolaborasi** — bukti bisa kerja tim.

Tiap proyek: **masalah → yang kamu lakukan → hasil terukur.**`,
    },
    {
      title: "Riset dulu: apa yang sebenarnya dicari",
      contentMd: `## Portofolio itu jawaban, bukan pameran

Sebelum menyusun apa pun, cari tahu dulu pertanyaan yang mau kamu jawab. Cara paling murah: baca iklan lowongan dan brief klien di bidangmu, lalu hitung kata yang terus berulang.

## Latihan 30 menit

1. Buka LinkedIn Jobs atau Glints, cari posisi yang kamu incar, ambil **10 lowongan**.
2. Salin bagian "kualifikasi" dan "tanggung jawab" ke satu Google Docs.
3. Tandai setiap kata kerja yang muncul di minimal 3 dari 10 lowongan itu.

Kalau kamu mengarah ke freelance, ganti sumbernya: 10 job posting di Sribu atau Projects.co.id, plus permintaan jasa yang lewat di grup WhatsApp/Facebook komunitasmu.

## Ubah jadi daftar bukti

| Yang sering diminta | Bukti yang harus ada di portofolio |
| --- | --- |
| "membuat laporan bulanan" | satu contoh laporan, data disamarkan |
| "koordinasi vendor" | cerita singkat: masalah, aksi, hasil |
| "mahir Excel/Sheets" | file yang bisa dibuka dan dilihat rumusnya |

Kalau satu permintaan muncul di 8 dari 10 lowongan tapi tidak ada buktinya di portofoliomu, itu lubang paling mahal — tambal duluan.

> Simpan dokumen ini. Tiap kali kamu selesai satu proyek, cek lagi: baris mana yang baru saja terbukti?`,
      links: [
        { label: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs" },
        { label: "Glints Indonesia", url: "https://glints.com" },
        { label: "Sribu", url: "https://www.sribu.com" },
      ],
    },
    {
      title: "Menulis studi kasus: masalah, aksi, hasil",
      contentMd: `## Satu halaman, empat blok

Studi kasus bukan cerita panjang. Empat blok saja, 150–250 kata, plus satu gambar.

1. **Masalah** — situasi sebelum kamu masuk, sertakan angkanya.
2. **Aksi** — yang KAMU kerjakan, bukan yang dikerjakan tim.
3. **Hasil** — perubahan setelahnya, seukur mungkin.
4. **Bukti** — tangkapan layar, file contoh, atau tautan.

## Contoh nyata (admin toko online)

**Masalah.** Rekap pesanan dari tiga marketplace dikerjakan manual tiap pagi, sekitar 90 menit, dan ongkir sering salah hitung sehingga selisih kas muncul hampir tiap minggu.

**Aksi.** Aku bikin satu Google Sheets: satu tab per marketplace, satu tab rekap yang menarik data otomatis, dan tabel ongkir yang dipanggil pakai rumus supaya tidak diketik ulang.

**Hasil.** Rekap pagi turun jadi sekitar 20 menit, dan selisih ongkir tidak muncul lagi selama dua bulan terakhir yang aku pantau.

**Bukti.** Tangkapan layar sheet dengan nama pembeli disamarkan, plus satu tangkapan layar rumusnya.

## Yang bikin studi kasus lemah

- Kata "membantu" tanpa keterangan kamu membantu apa.
- Daftar tugas harian, bukan satu masalah yang selesai.
- Hasil tanpa cara ukur, misalnya "jadi jauh lebih efisien".

> Tulis satu studi kasus hari ini untuk pekerjaan yang paling kamu ingat detailnya.`,
    },
    {
      title: "Angka hasil kalau kamu belum punya klien",
      contentMd: `## Jangan mengarang angka

Angka palsu gampang ketahuan: pewawancara cuma perlu bertanya "diukur pakai apa?" dan ceritamu ambruk. Lebih baik angka kecil yang jujur daripada "naik 300%" yang tidak bisa kamu jelaskan.

## Empat angka yang bisa kamu ukur sendiri

| Jenis | Cara ukur gratis |
| --- | --- |
| **Waktu** | catat durasi sebelum dan sesudah pakai stopwatch HP |
| **Jumlah** | hitung unit yang selesai per jam atau per hari |
| **Kesalahan** | hitung berapa kali kamu harus memperbaiki, sebelum vs sesudah |
| **Jangkauan** | angka bawaan platform: tayangan, klik, unduhan |

Ukur SEBELUM kamu memperbaiki apa pun. Kalau sudah telanjur, ukur kondisi sekarang dan catat perkiraan lama sebagai perkiraan — sebut memang perkiraan.

## Kalau benar-benar tidak ada angka

Tulis apa adanya, lalu ganti dengan bukti lain:

- "Dikerjakan dalam 6 jam, dari brief sampai file siap pakai."
- "Belum diuji ke pengguna nyata; ini proyek latihan."
- "Diperiksa oleh dua orang di komunitas, catatannya aku terapkan di versi 2."

Kejujuran seperti ini justru menaikkan kepercayaan, karena menunjukkan kamu tahu bedanya bukti dan klaim.

> Aturan pribadi yang aman: jangan tulis satu angka pun yang tidak bisa kamu ceritakan cara mengukurnya dalam 30 detik.`,
    },
    {
      title: "Bikin proyek latihan yang terasa nyata",
      contentMd: `## Latihan boleh, palsu jangan

Proyek latihan sah dipajang asal kamu jujur menyebutnya latihan. Yang bikin latihan terasa nyata adalah **subjeknya nyata** dan **batasannya nyata**.

## Tiga sumber subjek gratis

- **UMKM di sekitarmu** — warung, laundry, katering. Perbaiki satu hal kecil: daftar harga, alur pesanan WhatsApp, rekap stok.
- **Data publik** — ambil satu tabel dari data.go.id atau BPS, lalu jawab satu pertanyaan konkret dengan Google Sheets.
- **Layanan yang bikin kesal** — formulir, brosur, atau alur pendaftaran yang berantakan. Rombak versinya, jelaskan alasan tiap perubahan.

## Cara mengerjakan supaya mirip kerja beneran

1. Tulis brief satu paragraf: siapa penggunanya, apa yang mau dicapai, batas waktumu.
2. Kunci waktu: satu akhir pekan. Batas waktu memaksa keputusan.
3. Hasilkan file yang benar-benar bisa dipakai orang, bukan mockup saja.
4. Tutup dengan studi kasus empat blok seperti materi sebelumnya.

## Etika yang wajib dipegang

Kalau kamu memakai nama usaha nyata, minta izin dulu — biasanya pemiliknya senang. Kalau tidak sempat minta izin, samarkan namanya ("warung kopi di Bandung") dan jangan pajang data pelanggan mereka.

> Satu proyek latihan yang selesai dan dipakai orang mengalahkan lima yang berhenti di tengah.`,
      links: [
        { label: "Satu Data Indonesia", url: "https://data.go.id" },
        { label: "Badan Pusat Statistik", url: "https://www.bps.go.id" },
      ],
    },
    {
      title: "Rumah portofolio gratis dan visual yang rapi",
      contentMd: `## Pilih satu rumah, jangan lima

Yang penting bukan platformnya, tapi **satu tautan yang gampang kamu sebar**. Semua pilihan di bawah gratis dan tidak butuh beli domain.

| Pilihan | Paling cocok untuk |
| --- | --- |
| Google Sites | siapa pun, paling cepat jadi, cukup drag & drop |
| Notion (halaman publik) | penulis, admin, ops — enak untuk teks panjang |
| GitHub Pages | yang belajar ngoding, sekalian jadi bukti skill |
| Fitur "Featured" LinkedIn | kalau target utamamu perekrut |

## Susunan halaman yang bekerja

1. Satu kalimat: kamu bantu SIAPA melakukan APA.
2. Tiga studi kasus, yang terkuat di paling atas.
3. Tentang kamu, singkat dan manusiawi.
4. Cara menghubungi: satu email atau satu tombol WhatsApp.

## Visual rapi tanpa jadi desainer

- Tangkapan layar penuh jendela, bukan foto layar pakai HP.
- Kompres gambar di Squoosh supaya halaman tidak berat di kuota orang.
- Pakai satu ukuran gambar yang sama untuk semua kartu proyek.
- Buka portofoliomu di HP sebelum dibagikan — kebanyakan orang membukanya dari HP.

> Uji lima detik: minta teman membuka tautanmu, lalu tutup setelah lima detik. Kalau dia tidak bisa menyebut kamu bisa apa, perbaiki kalimat pertama.`,
      links: [
        { label: "Google Sites", url: "https://sites.google.com" },
        { label: "Notion", url: "https://www.notion.so" },
        { label: "Squoosh (kompres gambar)", url: "https://squoosh.app" },
      ],
    },
    {
      title: "Portofolio kalau pekerjaanmu bukan desain",
      contentMd: `## Semua pekerjaan meninggalkan jejak

Admin, guru, staf keuangan, HR, gudang, customer service — semuanya menghasilkan berkas yang bisa dipamerkan. Yang perlu diubah cuma cara menyajikannya.

| Peran | Yang bisa dipajang |
| --- | --- |
| Admin / ops | SOP satu halaman, template rekap, alur persetujuan |
| Guru | rencana pembelajaran, lembar kerja, rekap nilai yang rapi |
| Keuangan | template arus kas, checklist tutup buku bulanan |
| HR | template deskripsi pekerjaan, panduan wawancara |
| Customer service | bank jawaban baku, alur penanganan keluhan |

## Aturan wajib: bersihkan dulu

Ini bagian yang paling sering dilanggar dan paling mahal akibatnya.

1. Hapus nama orang, NIK, nomor rekening, nomor telepon, dan alamat.
2. Ganti nama perusahaan dan klien jadi "PT A", "klien ritel".
3. Ganti angka sensitif seperti gaji dan harga khusus dengan angka contoh, lalu tulis jelas bahwa itu data contoh.
4. Kalau berkasnya milik kantor, minta izin. Kalau tidak boleh, buat ulang versi kosongnya sendiri di rumah — strukturnya milikmu, isinya tidak.

## Bungkus dengan cerita

Template tanpa cerita cuma file. Tambahkan tiga kalimat: dulu prosesnya begini, aku ubah begini, sekarang begini. Itu sudah cukup jadi studi kasus.

> Kalau ragu boleh dipajang atau tidak, anggap jawabannya tidak, lalu buat versi bersihnya.`,
    },
    {
      title: "Minta AI mengaudit portofoliomu",
      contentMd: `## AI itu pembaca pertama yang sabar

Claude, ChatGPT, dan Gemini punya tingkat gratis yang cukup untuk mengaudit tulisan portofoliomu. Dia tidak akan sungkan seperti temanmu, dan bisa kamu suruh mengulang sepuluh kali.

## Prompt yang bisa langsung dipakai

    Kamu perekrut yang skeptis dan cuma punya 30 detik.
    Ini teks studi kasus di portofolioku: [tempel teksnya]
    Tugasmu:
    1. Sebut 3 kalimat paling lemah dan alasannya.
    2. Tandai setiap klaim yang tidak ada buktinya.
    3. Tulis ulang paragraf hasil supaya lebih konkret,
       TANPA menambah angka yang tidak ada di teksku.
    4. Tutup dengan satu pertanyaan yang akan kamu tanyakan
       kalau aku diwawancara.

Poin 3 penting: tanpa larangan itu, AI akan dengan senang hati mengarang "naik 40%" dan kamu yang menanggung malunya di wawancara.

## Batas yang harus kamu tahu

- AI tidak bisa menilai selera visual dari teks. Untuk tata letak, tanya manusia.
- AI tidak tahu apakah klaimmu benar. Verifikasi tetap tugasmu.
- Jangan tempel isi berkas klien, kontrak, atau data pribadi ke chat gratis.
- Gaya tulisannya cenderung seragam. Ambil masukannya, tulis ulang pakai suaramu sendiri.

> Setelah AI, minta satu manusia di bidangmu membaca. Dua sudut pandang ini menangkap hal yang berbeda.`,
      links: [
        { label: "Claude", url: "https://claude.ai" },
        { label: "ChatGPT", url: "https://chatgpt.com" },
        { label: "Gemini", url: "https://gemini.google.com" },
      ],
    },
    {
      title: "Sebar, lamar, dan rawat tiap 90 hari",
      contentMd: `## Portofolio yang tidak dibagikan sama dengan tidak ada

Begitu tautanmu hidup, pasang di tempat yang sudah dilihat orang setiap hari.

- Bagian "Featured" dan headline LinkedIn.
- Tanda tangan email.
- Bio WhatsApp Business dan Instagram.
- Setiap lamaran, di baris paling atas, bukan diselipkan di lampiran.

## Cara mengirim yang menaikkan peluang

Jangan kirim tautan telanjang. Dua kalimat sudah cukup: sebut kebutuhan mereka, lalu tunjuk SATU studi kasus yang paling mirip.

    Halo Mbak Rina, saya lihat tim Anda sedang butuh bantuan rekap
    penjualan mingguan. Kasus paling mirip yang pernah saya kerjakan
    ada di sini: [tautan] — bagian "rekap tiga marketplace".

## Rawat empat kali setahun

Pasang pengingat 90 hari di Google Calendar, lalu lakukan tiga hal kecil:

1. Tambah satu studi kasus baru.
2. Buang atau perbaiki yang paling lemah — portofolio dinilai dari yang terburuk, bukan rata-rata.
3. Perbarui angka yang sudah basi dan cek semua tautan masih hidup.

## Ekspektasi yang jujur

Portofolio jarang menghasilkan panggilan dalam seminggu. Yang biasanya terjadi: obrolan yang sudah ada berubah jadi serius. Terus lamar, terus kirim penawaran, dan biarkan portofolio bekerja sebagai bukti di belakangmu.

> Catat tiap lamaran di Google Sheets: tanggal, tujuan, tautan, balasan. Setelah 20 baris, polanya kelihatan.`,
    },
  ],
  quizzes: [
    {
      title: "Kuis: Portofolio",
      passingScorePct: 60,
      questions: [
        { prompt: "Portofolio unggul dari CV karena…", options: ["Lebih panjang", "Menunjukkan bukti nyata", "Lebih formal", "Wajib PDF"], correctIndex: 1 },
        { prompt: "Idealnya portofolio berisi…", options: ["Sebanyak mungkin proyek", "3 proyek fokus & dalam", "Hanya sertifikat", "Screenshot acak"], correctIndex: 1 },
        { prompt: "Tiap proyek sebaiknya menampilkan…", options: ["Harga jasa", "Masalah → aksi → hasil", "Riwayat pendidikan", "Hobi"], correctIndex: 1 },
      ],
    },
  ],
};
