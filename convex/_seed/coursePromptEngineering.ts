// Starter course: "Prompt Engineering Praktis". See courseDasarAi.ts for why
// each course is its own file.
//
// FLAT list of materi (DECISIONS #37): the "Anatomi Prompt yang Baik" /
// "Pola Lanjutan" module headings are gone and the quiz hangs off the course.
//
// APPEND-ONLY below the first four. `_seed/curriculum.ts` upserts: it probes
// each materi by (tenantId, slug) and INSERTS only what is missing, so editing
// an existing lesson's contentMd here would be dead code — the live row it
// wrote earlier never changes. Materi 1-4 are therefore frozen verbatim and the
// ten new ones are appended, which is also where `upsertCurriculum` places them
// (past the course's high-water mark, never mid-sequence).
//
// Titles must stay unique across the TENANT, not just this course:
// `findMateriByTitle` walks the title-derived slug ladder, so a title reused
// from another kelas would re-place THAT materi here instead of writing a new
// one. Every title below was checked against the live set.
//
// Prompts use FENCED code blocks (\`\`\`text) with escaped backticks, not the
// 4-space indented blocks the older data files use: slices/markdown/lib/parse.ts
// only recognises fences, so an indented prompt renders as a mushed paragraph
// the reader cannot copy. This course is specimens or it is nothing.
//
// File length: pure Bahasa course copy, one `import type`, no runtime import —
// the same category docs/rr-conventions.md exempts as `convex/_seed/*Data.ts`.
// Renaming this file to match that glob would mean editing coursesData.ts too.
import type { SeedCourse } from "./types";

export const COURSE_PROMPT_ENGINEERING: SeedCourse = {
  slug: "prompt-engineering",
  title: "Prompt Engineering Praktis",
  description: "Teknik menyusun prompt agar AI memberi jawaban akurat, konsisten, dan sesuai kebutuhan.",
  lessons: [
    {
      title: "Struktur prompt: peran, konteks, tugas",
      contentMd: `## Formula sederhana

1. **Peran** — "Kamu adalah editor bahasa Indonesia."
2. **Konteks** — beri latar belakang & batasan.
3. **Tugas** — apa yang diminta, sejelas mungkin.
4. **Format** — bentuk output: poin, tabel, panjang maksimal.

Prompt yang jelas menghasilkan jawaban yang jelas.`,
    },
    {
      title: "Few-shot: mengajari AI lewat contoh",
      contentMd: `## Zero-shot vs few-shot

- **Zero-shot** — langsung minta tanpa contoh.
- **Few-shot** — beri 1–3 contoh input → output; model meniru polanya.

Few-shot sangat ampuh untuk output berformat konsisten (mis. klasifikasi atau gaya penulisan tertentu).`,
    },
    {
      title: "Chain-of-thought: minta AI berpikir bertahap",
      contentMd: `## "Pikirkan langkah demi langkah"

Untuk soal logika atau hitungan, minta model menjabarkan penalaran **sebelum** memberi jawaban akhir. Ini menurunkan kesalahan.

Contoh: *"Jelaskan langkah-langkahnya dulu, baru beri jawaban akhirnya."*`,
    },
    {
      title: "Menghindari halusinasi",
      contentMd: `## Halusinasi = jawaban ngawur yang terdengar meyakinkan

Cara menekannya:

- Minta model **mengutip sumber** atau berkata "tidak tahu" bila ragu.
- Beri **konteks / data** sendiri, jangan andalkan ingatannya.
- **Verifikasi** setiap klaim penting.`,
    },
    {
      title: "Enam bagian prompt yang bekerja",
      contentMd: `## Prompt itu briefing, bukan mantra

Materi pertama sudah memberi formula tiga bagian: peran, konteks, tugas. Mulai di sini kita bongkar formula itu jadi enam bagian dan pakai sisa kelas untuk melatih satu per satu.

Prompt yang bekerja mirip briefing ke rekan baru: dia cepat, tapi belum tahu apa pun soal pekerjaanmu. Enam bagian inilah yang membedakan jawaban "lumayan" dari jawaban yang langsung bisa dipakai.

| Bagian | Isinya | Contoh singkat |
| --- | --- | --- |
| Peran | siapa dia saat menjawab | "Kamu editor bahasa Indonesia" |
| Konteks | latar dan pembacanya | "untuk pelanggan UMKM di Bandung" |
| Tugas | satu kata kerja yang jelas | "tulis ulang", "ringkas", "bandingkan" |
| Format | bentuk jawaban | "tabel 3 kolom", "maksimal 5 poin" |
| Batasan | pantangan | "tanpa istilah asing, tanpa emoji" |
| Contoh | satu sampel hasil yang benar | potongan kalimat gaya kamu |

## Yang buruk vs yang diperbaiki

Buruk — terlalu umum, jawabannya pasti generik:

\`\`\`text
Tolong buatkan caption promosi.
\`\`\`

Diperbaiki:

\`\`\`text
Kamu penulis konten UMKM. Aku jual kopi bubuk 200 gram harga Rp45.000,
pembelinya ibu-ibu usia 30-45 di Bandung yang memesan lewat WhatsApp.
Tulis 3 caption Instagram, masing-masing maksimal 2 kalimat, dan kalimat
terakhirnya mengajak chat WA. Tanpa tagar, tanpa emoji.
\`\`\`

Bedanya bukan panjang, tapi jumlah keputusan yang sudah kamu ambil untuk AI. Setiap keputusan yang tidak kamu tulis akan ditebak sendiri olehnya — dan tebakannya adalah rata-rata internet, bukan usahamu.`,
      links: [
        { label: "Panduan prompt engineering — Anthropic", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
      ],
    },
    {
      title: "Peran dan konteks: bekal yang wajib kamu berikan",
      contentMd: `## Peran memilih kosakata, konteks mengisi fakta

Materi pertama menyebut peran dan konteks dalam satu baris. Ini versi panjangnya — dua bagian yang paling sering ditulis asal-asalan, padahal paling murah diperbaiki.

Keduanya sering dianggap basa-basi. Justru keduanya yang paling besar efeknya: **peran** menentukan sudut pandang dan kosakata, **konteks** mencegah AI mengarang latar.

## Peran yang berguna itu spesifik, bukan pujian

Menyebut "kamu ahli hebat kelas dunia" tidak menambah apa-apa. Menyebut kepentingannya menambah banyak.

- Lemah: "Kamu asisten yang pintar."
- Kuat: "Kamu HRD yang menyaring 200 lamaran sehari dan cuma punya 20 detik per berkas."

## Konteks: empat hal yang perlu dia tahu

Siapa pembacanya, apa yang sudah mereka tahu, apa yang kamu mau mereka lakukan setelah membaca, dan apa yang tidak boleh disinggung.

\`\`\`text
Kamu HRD di perusahaan logistik dengan 60 karyawan di Surabaya.
Konteks: kami merekrut 1 admin gudang, gaji Rp4.200.000, sistem 2 shift.
Pelamar yang kami incar lulusan SMK dan biasanya melamar lewat Instagram.
Kami belum pernah memasang lowongan berbayar; anggaran iklan nol.
Tugas: tulis satu lowongan yang habis dibaca di layar HP dalam 20 detik.
Format: judul, 4 poin syarat, 3 poin fasilitas, cara melamar di baris terakhir.
\`\`\`

> Bingung konteks apa yang perlu ditulis? Balik pertanyaannya: kalau instruksi ini kamu kirim ke anak magang hari pertama, apa yang pasti dia tanyakan balik? Itulah yang kurang.`,
    },
    {
      title: "Contoh yang benar: few-shot untuk hasil konsisten",
      contentMd: `## Menjelaskan gaya itu sulit, menunjukkan gaya itu mudah

Materi kedua sudah memperkenalkan istilah few-shot. Di sini kita pakai betulan: berapa contoh yang cukup, contoh seperti apa yang menolong, dan kapan justru merusak.

Kamu bisa menulis satu paragraf penuh soal "nada ramah tapi profesional" dan hasilnya tetap meleset. Tempel dua contoh jadi, hasilnya langsung mirip. Itulah inti few-shot: mengajari lewat sampel, bukan lewat penjelasan.

## Kapan few-shot paling menghemat waktu

- Pekerjaan berulang dengan bentuk tetap: balasan chat, deskripsi produk, kategori pengeluaran.
- Gaya bahasa khas tim atau tokomu yang susah dijelaskan dengan kata-kata.
- Hasil yang harus bisa ditempel langsung ke Sheets tanpa dirapikan lagi.

## Contoh lengkap: mengelompokkan pengeluaran

\`\`\`text
Tugasmu mengelompokkan catatan pengeluaran ke satu kategori.
Kategori yang boleh dipakai hanya: Operasional, Bahan Baku, Gaji, Pribadi.

Contoh:
"Beli galon air kantor 3 buah 60000" -> Operasional
"Transfer ke Bu Sri, jahit 20 pcs, 850000" -> Bahan Baku
"Bayar langganan streaming 65000" -> Pribadi

Sekarang kelompokkan baris di bawah dengan format yang sama persis,
satu baris satu hasil, tanpa penjelasan tambahan:
[tempel daftar pengeluaranmu di sini]
\`\`\`

## Aturan main memberi contoh

Dua sampai empat contoh sudah cukup; lebih dari itu jarang menambah ketepatan. Pastikan ada contoh untuk kasus yang SULIT, bukan yang gampang saja — kalau semua contohmu jelas, kasus abu-abu tetap ditebak ngawur.`,
    },
    {
      title: "Minta format spesifik: tabel, poin, dan panjang",
      contentMd: `## Format yang tidak kamu minta akan dipilihkan

Kalau bentuk jawaban tidak kamu tentukan, AI hampir selalu memberi paragraf panjang plus basa-basi. Menyebut format menghemat waktu merapikan dan bikin hasilnya bisa langsung dipakai.

| Kebutuhan | Minta format ini | Alasannya |
| --- | --- | --- |
| Ditempel ke Sheets | tabel dengan pemisah titik koma | kolomnya langsung terbaca |
| Dibaca cepat atasan | maksimal 5 poin, satu baris satu poin | tidak perlu diringkas ulang |

## Prompt yang menghasilkan tabel siap tempel

\`\`\`text
Kamu asisten admin. Dari catatan rapat di bawah, keluarkan daftar tindak lanjut.
Format: tabel dengan pemisah titik koma, tanpa spasi setelah titik koma,
kolomnya persis: tugas;penanggung jawab;tenggat
Baris pertama adalah header. Jangan menulis kalimat apa pun di luar tabel.
Kalau penanggung jawab atau tenggat tidak disebut, isi "belum ditentukan".
Catatan rapat:
[tempel di sini]
\`\`\`

Kalimat "jangan menulis kalimat apa pun di luar tabel" itu yang mengusir pembuka "Tentu, berikut adalah…", pembuka yang bikin hasil gagal ditempel rapi ke Sheets lewat Berkas > Impor.

> Kalau membatasi panjang, sebut satuan yang bisa dihitung: "maksimal 4 kalimat" jauh lebih dipatuhi daripada "singkat saja". Jumlah kata sering meleset karena model tidak benar-benar menghitung kata.`,
      links: [{ label: "Google Sheets (gratis)", url: "https://sheets.google.com" }],
    },
    {
      title: "Batasan: menyebut apa yang tidak boleh dilakukan",
      contentMd: `## Sebutkan pantangannya, jangan berharap ditebak

Prompt yang matang bukan cuma daftar permintaan. Ada bagian kedua yang sama pentingnya: apa yang TIDAK boleh muncul.

## Tiga batasan yang paling sering menyelamatkan

- **Jangan mengarang** — "kalau informasinya tidak ada di teks yang aku tempel, tulis 'tidak ada di dokumen'."
- **Jangan menambah janji** — untuk jualan: "jangan menyebut diskon, garansi, atau klaim kesehatan."
- **Jangan menyimpulkan** sebelum diminta: "berhenti di daftar temuan, jangan beri rekomendasi."

## Contoh: meringkas perjanjian tanpa dikarang

\`\`\`text
Kamu asisten administrasi. Di bawah ini isi perjanjian kerja sama kami.
Tugas: daftar kewajiban pihak kami dan semua tanggal penting.
Aturan keras:
1. Gunakan hanya informasi yang tertulis di teks. Dilarang menyimpulkan.
2. Setiap poin harus mengutip potongan kalimat aslinya di dalam tanda kutip.
3. Yang tidak jelas, kumpulkan di bagian terakhir "Perlu dicek manusia".
4. Jangan memberi nasihat hukum dan jangan menilai adil atau tidaknya perjanjian.
Teks perjanjian:
[tempel di sini]
\`\`\`

## Batasan itu rem, bukan jaminan

Untuk hal berisiko — perjanjian, obat, pajak, angka yang dilaporkan ke luar — hasil AI tetap draft yang wajib diperiksa orang yang paham. Dan jangan menempel data rahasia ke chat gratis: batasan di prompt tidak mengubah ke mana teksmu terkirim.`,
    },
    {
      title: "Iterasi saat jawaban meleset",
      contentMd: `## Jangan mengulang dari nol

Kesalahan paling umum: hasil pertama jelek, chat ditutup, prompt diketik ulang dari awal. Padahal jawaban yang salah itu informasi — dia menunjukkan bagian mana dari instruksimu yang masih kosong.

| Gejala | Sebab biasanya | Perbaikannya |
| --- | --- | --- |
| Benar tapi generik | konteks kurang | tambah detail nyata: angka, nama, situasi |
| Bentuknya salah terus | format tidak disebut tegas | beri satu contoh hasil yang benar |
| Isinya mengarang | dia tidak punya bahan | tempel sumbernya, larang menebak |

## Kalimat lanjutan yang ampuh

\`\`\`text
Jawabanmu belum pas. Yang salah: nadanya terlalu formal dan ada tiga istilah
asing (engagement, insight, conversion). Yang sudah benar dan harus kamu
pertahankan: struktur tiga paragrafnya dan urutan argumennya.
Ganti istilah asing dengan bahasa sehari-hari, dan buat kalimat pertama
langsung menyebut harga. Tulis ulang lengkap, jangan cuma menjelaskan
apa yang kamu ubah.
\`\`\`

Polanya: sebut apa yang SALAH, sebut apa yang sudah BENAR dan harus dipertahankan, lalu minta versi utuh. Tanpa bagian kedua, perbaikan sering merusak hal yang tadinya sudah bagus.

> Kalau tiga kali koreksi masih meleset, berhenti. Buka chat baru dan tulis ulang prompt awalnya dengan semua yang baru kamu pelajari — percakapan yang telanjur salah arah cenderung terus salah arah.`,
    },
    {
      title: "Prompt untuk menulis: kerangka, isi, poles",
      contentMd: `## Pisahkan tiga pekerjaan yang berbeda

Menulis dengan AI jadi berantakan kalau semuanya diminta sekaligus. Pecah jadi tiga giliran, supaya kamu sempat membetulkan arah sebelum kalimatnya telanjur banyak.

## Giliran 1 — kerangka

\`\`\`text
Kamu penulis untuk pembaca awam. Aku mau menulis artikel sekitar 700 kata
untuk warga desa tentang cara mengurus KTP yang hilang.
Buat kerangkanya saja: 5 sampai 7 subjudul, tiap subjudul satu kalimat isi.
Belum usah ditulis penuh, dan jangan pakai istilah asing.
\`\`\`

## Giliran 2 — isi, satu bagian per pesan

Setelah kerangkanya kamu setujui dan sunting sendiri, minta isi SATU bagian per pesan. Hasilnya jauh lebih berisi daripada meminta seluruh artikel sekaligus, karena perhatian model tidak terbagi.

## Giliran 3 — poles memakai contoh nadamu

\`\`\`text
Ini dua paragraf yang biasa aku tulis sendiri:
"[tempel dua paragraf tulisanmu]"
Tulis ulang draft di bawah supaya nadanya sama dengan dua paragraf itu.
Jangan menambah informasi baru, jangan mengubah angka, jangan memanjangkan.
Draft:
[tempel draft]
\`\`\`

> Jujur soal batasnya: AI menulis kalimat yang rapi, bukan kalimat yang benar. Nama orang, tanggal, nominal rupiah, nomor peraturan — semuanya wajib kamu cek sendiri sebelum dikirim. Kalimat yang paling meyakinkan justru yang paling sering perlu diperiksa.`,
      links: [{ label: "Google Docs (gratis)", url: "https://docs.google.com" }],
    },
    {
      title: "Prompt untuk analisis: data dan dokumen",
      contentMd: `## Analisis butuh bahan, bukan ingatan

Untuk pekerjaan analisis, kerja terbesarmu ada sebelum prompt: menyiapkan bahan. AI yang tidak diberi data akan menjawab dari rata-rata internet, dan rata-rata internet tidak ada hubungannya dengan usahamu.

## Pola prompt analisis

\`\`\`text
Kamu analis yang teliti dan tidak suka melebih-lebihkan.
Data di bawah adalah penjualan warung kopi kami, Januari-Juni,
satu baris per hari dengan format: tanggal;jumlah gelas;omzet
Tugas:
1. Sebut 3 pola yang paling jelas, masing-masing dengan angka pendukungnya.
2. Sebut 2 hal yang mencurigakan atau perlu dicek ulang.
3. Sebut 1 hal yang TIDAK bisa disimpulkan dari data ini walau kelihatannya bisa.
Jangan memberi saran bisnis dulu. Jangan menyebut angka yang tidak ada di data.
Data:
[tempel di sini]
\`\`\`

Poin nomor 3 itu yang paling sering menyelamatkan. Dia memaksa AI menyebut batas datanya sendiri, misalnya "kenaikan bulan Juni tidak bisa disebut efek promosi, karena tidak ada kolom promosi di data ini".

## Selalu cek satu angka

Model bahasa sering salah aritmetika pada data panjang. Ambil satu angka yang dia sebut, hitung ulang sendiri di Google Sheets dengan =SUM atau =AVERAGE. Kalau satu angka meleset, curigai semuanya. Untuk data besar, lebih aman meminta RUMUS-nya saja lalu biarkan Sheets yang menghitung.`,
      links: [
        { label: "Google Sheets (gratis)", url: "https://sheets.google.com" },
        { label: "Satu Data Indonesia", url: "https://data.go.id" },
      ],
    },
    {
      title: "Prompt untuk kode walau kamu bukan programmer",
      contentMd: `## Kamu tidak perlu bisa ngoding untuk memakai kode

Banyak pekerjaan kecil lebih cepat selesai dengan sepotong kode daripada klik berulang: merapikan 3.000 nomor HP, menyeragamkan format tanggal, memisahkan nama depan dan belakang. Yang perlu kamu bisa hanya menempel dan menjalankan.

## Mulai dari yang paling aman: rumus

\`\`\`text
Kamu ahli Google Sheets. Di sheet-ku, kolom A berisi nomor HP dengan format
campur: ada "0812-3456-7890", ada "+62 812 3456 7890", ada "0812 3456 7890".
Buat satu rumus di kolom B yang mengubah semuanya menjadi format
62xxxxxxxxxxx tanpa spasi dan tanpa tanda hubung.
Syarat: pakai rumus Google Sheets biasa, bukan Apps Script.
Jelaskan cara memasangnya dalam 3 langkah untuk orang yang belum pernah
pakai rumus. Sebutkan juga kasus yang rumus ini TIDAK tangani.
\`\`\`

## Aturan main biar tidak celaka

- **Kerjakan di SALINAN** file, tidak pernah di data aslinya.
- **Minta penjelasan tiap baris** kalau kodenya lebih dari lima baris. Kalau dia tidak sanggup menjelaskan, jangan dipakai.
- **Jangan menjalankan kode yang menghapus, mengirim, atau membayar apa pun** sebelum diperiksa orang yang paham.
- **Jangan menempel kata sandi, token, atau kunci akses** ke chat.

> Kalau muncul error, tempel PESAN ERROR-nya apa adanya beserta kode yang kamu jalankan. Melapor "kok gagal ya" tidak akan menghasilkan perbaikan.`,
      links: [{ label: "Google Apps Script (gratis)", url: "https://developers.google.com/apps-script" }],
    },
    {
      title: "Membangun prompt andalanmu sendiri",
      contentMd: `## Prompt sekali pakai itu boros

Kalau satu pekerjaan kamu ulang lebih dari tiga kali sebulan, prompt-nya layak disimpan. Yang disimpan bukan percakapannya, tapi TEMPLATE-nya: prompt berlubang yang tinggal diisi.

## Kerangka template yang bisa disalin

\`\`\`text
PERAN: Kamu [peran spesifik, sebut kepentingannya].
KONTEKS: [siapa pembacanya, apa latarnya, apa yang sudah mereka tahu]
TUGAS: [satu kata kerja dan objeknya]
FORMAT: [bentuk persis, pakai satuan yang bisa dihitung]
BATASAN: [pantangan, larangan mengarang, hal yang tidak boleh disebut]
CONTOH HASIL YANG BENAR:
[satu sampel pendek]
BAHAN:
[tempel di sini]
\`\`\`

## Cara merawat koleksimu

1. Simpan di satu tempat yang gampang dibuka — satu dokumen Google Docs berisi semua template, tiap template diberi judul jelas.
2. Setiap kali kamu mengoreksi hasil, tanya: koreksi ini bisa masuk ke template? Kalau bisa, tambahkan saat itu juga.
3. Tulis satu baris catatan "ini dipakai untuk apa" beserta tanggalnya. Tiga bulan lagi kamu lupa.
4. Buang template yang tidak pernah dipakai. Empat puluh prompt menganggur lebih buruk daripada lima yang hafal.

> Tantangan penutup: ambil pekerjaan yang paling sering kamu ulang minggu ini, tulis satu template lengkap memakai kerangka di atas, pakai tiga kali, lalu perbaiki. Yang lolos tiga kali pemakaian biasanya layak disimpan selamanya.`,
      links: [{ label: "Google Docs (gratis)", url: "https://docs.google.com" }],
    },
  ],
  quizzes: [
    {
      title: "Kuis: Prompt Engineering",
      passingScorePct: 70,
      questions: [
        {
          prompt: "Urutan formula prompt yang baik adalah…",
          options: [
            "Tugas → Peran → Format",
            "Peran → Konteks → Tugas → Format",
            "Format → Tugas saja",
            "Acak, tidak penting",
          ],
          correctIndex: 1,
        },
        {
          prompt: "Few-shot artinya…",
          options: [
            "Prompt tanpa contoh",
            "Memberi beberapa contoh input → output",
            "Prompt yang sangat pendek",
            "Menghapus semua konteks",
          ],
          correctIndex: 1,
          explanation: "Few-shot = memberi contoh agar model meniru polanya.",
        },
        {
          prompt: "Chain-of-thought paling berguna untuk…",
          options: ["Mempercantik teks", "Soal logika/penalaran bertahap", "Membuat gambar", "Mempercepat model"],
          correctIndex: 1,
        },
        {
          prompt: "Cara menekan halusinasi AI?",
          options: [
            "Minta model menebak sebisanya",
            "Larang model berkata 'tidak tahu'",
            "Beri konteks, minta sumber, lalu verifikasi",
            "Naikkan temperature setinggi mungkin",
          ],
          correctIndex: 2,
        },
      ],
    },
  ],
};
