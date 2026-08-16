// Starter course: "Dasar AI untuk Semua". One course per file — adding a class
// is then a new file plus one line in coursesData.ts, not a diff in the middle
// of a 200-line array.
//
// FLAT list of materi (DECISIONS #37): the "Mengenal AI & LLM" / "Pakai AI
// Sehari-hari" module headings are gone, their lessons concatenated in the
// order a learner already saw them, and the quiz moved onto the course.
//
// APPEND-ONLY below materi 4. `upsertCurriculum` probes each materi by
// (tenantId, slug) and INSERTS only what is missing, so editing the copy of a
// materi that is already live changes nothing in production — it would only
// make this file lie about the rows it seeded. Materi 1–4 are therefore frozen
// as written, and 5–14 were appended so the reading order still holds when
// they land past the course's placement high-water mark.
//
// The single course quiz still asks only about materi 1–2 (LLM, prediksi
// token, context window). Every question remains correct, but the kuis is now
// narrow for a 14-materi kelas. Left as-is on purpose: `upsertCurriculum`
// matches quizzes by TITLE, so rewriting these questions is dead code the same
// way rewriting a live materi is — a broader kuis has to arrive as NEW quiz
// rows with new titles, which is a content decision, not this file's job.
//
// Pure Bahasa-Indonesia course copy, one `import type`, no runtime import —
// same class the 200-LOC exemption in docs/rr-conventions.md carves out for
// `convex/_seed/*Data.ts`; splitting one curriculum across files would only
// hide it.
import type { SeedCourse } from "./types";

export const COURSE_DASAR_AI: SeedCourse = {
  slug: "dasar-ai",
  title: "Dasar AI untuk Semua",
  description:
    "Pahami AI, machine learning, dan LLM dari nol — tanpa jargon, langsung ke praktik sehari-hari.",
  lessons: [
    {
      title: "Apa itu AI, ML, dan LLM?",
      contentMd: `## Tiga istilah yang sering tertukar

- **AI (Artificial Intelligence)** — payung besar: sistem yang meniru kemampuan berpikir manusia.
- **ML (Machine Learning)** — cara AI belajar dari data, bukan diprogram aturan satu per satu.
- **LLM (Large Language Model)** — model ML raksasa yang dilatih pada teks. Contohnya Claude dan GPT.

Analogi: AI itu "kendaraan", ML itu "mesinnya", LLM itu "mobil balap khusus bahasa".

## Kenapa LLM terasa pintar?

LLM belajar pola dari miliaran kalimat, lalu memprediksi kata berikutnya yang paling masuk akal. Ia tidak "tahu" fakta seperti database — ia **memperkirakan**.

> Ingat: LLM bisa salah dengan percaya diri. Selalu verifikasi hal penting.`,
      links: [{ label: "Coba Claude gratis", url: "https://claude.ai" }],
    },
    {
      title: "Bagaimana LLM 'berpikir'",
      contentMd: `## Token, bukan kata

LLM memecah teks jadi potongan kecil bernama **token**, memprosesnya, lalu memprediksi token berikutnya.

## Context window

Model punya "ingatan kerja" terbatas — jumlah token yang bisa dibaca sekaligus. Percakapan yang sangat panjang bisa membuat bagian awal seperti "terlupa".

## Temperature (suhu)

Parameter yang mengatur kreativitas jawaban:

- **rendah** → aman & konsisten
- **tinggi** → lebih variatif, tapi lebih berisiko ngawur`,
    },
    {
      title: "Alat AI populer & kegunaannya",
      contentMd: `## Peta alat

- **Chat / asisten** — Claude, ChatGPT, Gemini: menulis, meringkas, brainstorming, analisis. Ketiganya punya tingkat gratis.
- **Gambar** — untuk mencoba tanpa bayar, mulai dari pembuat gambar yang sudah menempel di asisten gratis (Gemini, Copilot). **Midjourney tidak punya tingkat gratis** — bagus, tapi jangan dijadikan titik awal.
- **Kode** — Claude Code, Copilot: membantu ngoding. Pemakaian penuhnya berbayar; untuk belajar, asisten chat biasa sudah cukup jauh.

## Tips memilih

Cocokkan alat dengan tugasnya. Untuk teks & analisis, asisten chat sudah sangat kuat dan jadi titik awal terbaik.

Harga dan batas gratis berubah tiap beberapa bulan, jadi jangan dihafal — cek sendiri sebelum mengeluarkan uang. Dan tidak ada satu pun materi di kelas ini yang mengharuskan kamu berlangganan apa pun.`,
      links: [{ label: "Claude", url: "https://claude.ai" }],
    },
    {
      title: "Etika & batasan AI",
      contentMd: `## Yang perlu dijaga

- **Privasi** — jangan tempel data sensitif atau rahasia ke AI publik.
- **Hak cipta** — hasil AI bisa mirip karya lain; cek sebelum dipakai komersial.
- **Bias** — AI mewarisi bias dari data latihnya.
- **Verifikasi** — untuk keputusan penting (medis, hukum, keuangan), AI itu asisten, bukan penentu akhir.`,
    },
    {
      title: "Yang bisa dan tidak bisa dilakukan AI",
      contentMd: `## Tiga kotak, bukan dua

Kebanyakan orang mengira AI cuma punya dua kotak: "bisa" dan "tidak bisa". Padahal ada kotak ketiga di tengah — dan justru di situlah sebagian besar pekerjaan sehari-hari berada.

| Kuat | Bisa, tapi wajib dicek | Jangan diserahkan |
| --- | --- | --- |
| Meringkas & menulis ulang | Angka, tanggal, nama orang | Keputusan medis, hukum, keuangan |
| Menerjemahkan & merapikan bahasa | Kutipan pasal atau aturan | Data rahasia & data pribadi orang lain |
| Brainstorming & bikin kerangka | Hitungan dan persentase | Klaim yang kamu sendiri tak bisa buktikan |
| Menjelaskan istilah asing | Ringkasan dokumen panjang | Menjawab atas nama orang lain |

## Kenapa polanya begitu

Ingat materi pertama: LLM memperkirakan kata berikutnya. Ia paling kuat saat BAHANNYA sudah kamu sediakan sendiri, dan paling rapuh saat harus mengandalkan ingatannya tentang dunia luar.

Aturan praktis: **makin banyak bahan yang kamu berikan, makin kecil peluang jawaban ngawur.** "Ringkas surat ini" jauh lebih aman daripada "berapa tarif parkir di kotaku tahun ini".

## Coba hari ini

Ambil satu paragraf tulisanmu sendiri, minta AI membuat tiga versi: lebih singkat, lebih sopan, lebih tegas. Itu pekerjaan kotak kiri — kamu akan langsung merasakan di mana AI benar-benar kuat, tanpa risiko apa pun.`,
    },
    {
      title: "Memilih asisten AI gratis & bikin akun pertama",
      contentMd: `## Tidak ada yang "paling benar"

Claude, ChatGPT, dan Gemini sama-sama punya tingkat gratis yang cukup untuk kebutuhan harian. Bedanya tipis dan berubah tiap beberapa bulan, jadi jangan habiskan waktu memilih — pilih satu, pakai seminggu, baru bandingkan.

- **Claude** (claude.ai) — enak untuk tulisan panjang dan instruksi yang detail.
- **ChatGPT** (chatgpt.com) — paling banyak dipakai, paling banyak tutorialnya.
- **Gemini** (gemini.google.com) — praktis kalau keseharianmu sudah di Gmail dan Google Docs.

Semuanya membatasi jumlah pesan gratis per jangka waktu tertentu, dan batas itu sering berubah — jangan dihafal. Kalau satu sedang penuh, pindah ke yang lain; isi pekerjaannya sama saja.

## Daftar dengan aman

1. Pakai email pribadi yang kamu nyaman bagikan, bukan email kantor (kecuali kantor memang menyediakan akun resmi).
2. Nyalakan verifikasi dua langkah di email itu.
3. Buka menu Settings > Privacy di akun barumu, lihat apakah percakapanmu dipakai melatih model. Kalau ada pilihan mematikannya, matikan.

## Tes sepuluh menit

Coba tiga tugas kecil berturut-turut: ringkas satu artikel jadi tiga poin, perbaiki satu pesan WhatsApp supaya lebih sopan, lalu minta penjelasan satu istilah yang selama ini bikin kamu bingung. Sepuluh menit itu sudah cukup untuk tahu alat mana yang cocok dengan caramu bekerja.`,
      links: [
        { label: "Claude", url: "https://claude.ai" },
        { label: "ChatGPT", url: "https://chatgpt.com" },
        { label: "Gemini", url: "https://gemini.google.com" },
      ],
    },
    {
      title: "Yang tidak boleh kamu tempel ke chatbot",
      contentMd: `## Anggap kotak chat itu papan pengumuman

Materi tentang etika sudah menyebut privasi dalam satu baris. Ini versi panjangnya, karena inilah kesalahan pemula yang paling mahal akibatnya.

## Daftar merah — jangan pernah ditempel

- NIK, foto KTP, kartu keluarga, atau dokumen identitas siapa pun.
- Nomor rekening, nomor kartu, dan **kode OTP** — tidak ada layanan sah yang memintanya.
- Password, kunci API, atau isi email verifikasi.
- Data kesehatan, gaji, dan data pribadi ORANG LAIN yang tidak memberi izin.
- Isi kontrak, harga khusus klien, atau rencana kantor yang belum diumumkan.

## Menyamarkan, supaya tetap bisa dibantu

Kamu tetap bisa minta bantuan tanpa membuka data. Buang yang mengenali orang, sisakan yang menjelaskan masalah:

    Sebelum: Budi Santoso, NIK 3273xxxx, gaji Rp8.400.000, telat cicilan 3 bulan.
    Sesudah: Seorang karyawan bergaji sekitar Rp8 juta, telat cicilan 3 bulan.

Kualitas jawabannya nyaris tidak berubah — AI butuh POLA masalahnya, bukan identitas orangnya.

## Kebiasaan kecil yang menyelamatkan

Hapus percakapan yang berisi hal sensitif setelah selesai. Dan sebelum menekan kirim, tanya satu hal ke diri sendiri: kalau isi kotak ini tiba-tiba muncul di grup WhatsApp keluarga, apakah aku tetap tenang?`,
      links: [
        { label: "Kebijakan Privasi Anthropic (Claude)", url: "https://www.anthropic.com/legal/privacy" },
        { label: "Kebijakan Privasi OpenAI (ChatGPT)", url: "https://openai.com/policies/privacy-policy" },
        { label: "Kebijakan Privasi Google", url: "https://policies.google.com/privacy" },
      ],
    },
    {
      title: "Membaca jawaban AI secara kritis",
      contentMd: `## Nada yakin bukan bukti

AI menulis kalimat yang salah dengan nada yang persis sama seperti kalimat yang benar. Tidak ada suara bergetar, tidak ada "hmm, aku kurang yakin". Jadi rasa percaya diri jawabannya tidak bisa dipakai sebagai ukuran kebenaran.

## Pisahkan jawaban jadi tiga jenis kalimat

1. **Olahan dari bahanmu sendiri** — ringkasan atau perbaikan dari teks yang kamu tempel. Risiko rendah; cek saja apakah ada yang hilang atau terbalik maknanya.
2. **Klaim fakta dari ingatan model** — angka, tanggal, nama, pasal, judul buku, kutipan. Risiko tinggi. Ini yang wajib diverifikasi.
3. **Saran dan opini** — "sebaiknya kamu…". Bukan soal benar-salah, tapi belum tentu cocok dengan situasimu.

Kebanyakan orang membaca ketiganya dengan tingkat percaya yang sama. Latihannya: sekali baca, tandai kalimat jenis kedua.

## Tanda bahaya yang gampang dilihat

- Angka yang terlalu bulat dan rapi ("meningkat tepat 40%").
- Kutipan lengkap di dalam tanda petik, plus nama tokohnya.
- Nomor pasal, nomor peraturan, atau tahun terbit yang sangat spesifik.
- Kalimat "menurut penelitian" tanpa menyebut penelitian yang mana.

> Satu kalimat penutup yang berguna: "Tandai bagian mana dari jawabanmu yang paling mungkin keliru." Jawabannya sering jujur, dan itu memangkas waktu memeriksa.`,
    },
    {
      title: "Halusinasi: kenapa terjadi dan cara mengeceknya",
      contentMd: `## Bukan berbohong, tapi menebak

Halusinasi adalah jawaban yang terdengar meyakinkan tapi tidak sesuai kenyataan. Penyebabnya bukan niat menipu: model memilih kelanjutan kalimat yang PALING MASUK AKAL, dan yang masuk akal tidak selalu benar. Kalau ia tidak tahu nomor pasalnya, bentuk "Pasal 12 ayat (2)" tetap terasa masuk akal — jadi keluarlah angka itu.

## Kapan risikonya paling besar

- Pertanyaan yang sangat spesifik: nomor peraturan, judul buku, nama penulis, harga, statistik daerah.
- Kejadian terbaru — model punya batas waktu pengetahuan, ia tidak otomatis tahu berita minggu ini.
- Topik yang jarang ditulis orang, misalnya prosedur di satu instansi di kota kecil.

## Tiga cara mengecek, dari yang paling cepat

1. **Tempel bahannya, lalu minta ditunjukkan.** "Bagian mana dari teks di atas yang mendukung ini?" Kalau ia tidak bisa menunjuk, klaim itu kemungkinan karangan.
2. **Tanya ulang di percakapan BARU**, tanpa memberi tahu jawaban sebelumnya. Jawaban yang berubah-ubah tiap kali ditanya adalah tanda tebakan, bukan pengetahuan.
3. **Cari sendiri ke sumber resmi.** Untuk aturan: peraturan.go.id. Untuk statistik: bps.go.id atau data.go.id. Lima menit di sana lebih menenangkan daripada sepuluh prompt.

> Jangan minta AI "sebutkan sumbernya" kalau ia tidak sedang mencari di internet — daftar pustaka pun bisa dikarang, lengkap dengan tautan yang tidak pernah ada.`,
      links: [
        { label: "JDIH Nasional (peraturan.go.id)", url: "https://peraturan.go.id" },
        { label: "Badan Pusat Statistik", url: "https://www.bps.go.id" },
        { label: "Satu Data Indonesia", url: "https://data.go.id" },
      ],
    },
    {
      title: "Bertanya lanjutan supaya jawabannya membaik",
      contentMd: `## Jawaban pertama itu draft, bukan hasil

Pemula biasanya berhenti di jawaban pertama: kalau cocok dipakai, kalau tidak cocok ditinggal. Padahal nilai terbesar AI ada di putaran kedua dan ketiga — dan itu cuma butuh satu kalimat tambahan.

## Enam kalimat lanjutan yang hampir selalu berguna

- "Terlalu panjang. Buat jadi maksimal lima kalimat."
- "Beri contoh konkret dengan konteks Indonesia."
- "Bagian mana dari jawabanmu yang kamu paling tidak yakin?"
- "Apa asumsi yang kamu pakai tanpa aku sebutkan?"
- "Tulis ulang untuk pembaca yang tidak paham istilah teknis."
- "Beri dua pilihan lain, lengkap dengan kelebihan dan kekurangannya."

## Perbaiki, jangan mengulang dari nol

Menempel ulang seluruh permintaan dari awal membuang konteks yang sudah terbangun. Cukup sebut APA yang kurang: "nadanya terlalu kaku", "poin ketiga tidak relevan, hapus", "pertahankan strukturnya, ganti contohnya". Semakin spesifik keluhanmu, semakin sedikit putaran yang kamu butuhkan.

## Kapan justru harus buka percakapan baru

Ingat context window di materi kedua: percakapan yang terlalu panjang membuat bagian awal seperti terlupa. Buka chat baru kalau topikmu berganti, kalau jawabannya mulai berputar-putar, atau kalau AI terus mengulang kesalahan yang sudah dua kali kamu koreksi.`,
    },
    {
      title: "Pakai AI untuk tulisan sehari-hari",
      contentMd: `## Tulisan yang paling sering bikin macet

Bukan laporan besar, tapi hal kecil: pesan ke pemilik kos, surat izin sekolah anak, caption jualan, ucapan duka yang tidak ingin salah nada. Semuanya punya pola yang mirip — dan pola berulang adalah keahlian utama AI.

## Isi lima hal ini, hasilnya langsung enak

    [SIAPA]   untuk siapa pesan ini, dan apa hubunganmu dengannya
    [MAKSUD]  apa yang kamu ingin terjadi setelah dia membaca
    [NADA]    sopan / akrab / tegas
    [PANJANG] misal: maksimal 4 kalimat
    [POIN]    hal yang wajib disebut (tanggal, angka, nama)

Contoh nyata:

    Tulis pesan WhatsApp ke pemilik kos, hubungan baik, nadanya sopan tapi jelas.
    Maksudnya minta keran kamar mandi yang bocor diperbaiki minggu ini.
    Maksimal 4 kalimat. Sebut: bocor sejak Sabtu, tagihan air jadi naik.

## Bagian yang tetap pekerjaanmu

Periksa nama, tanggal, dan angka — di situlah AI paling sering meleset. Lalu baca sekali pelan-pelan: apakah ini terdengar seperti kamu? Kalau terlalu berbunga-bunga, minta "buat lebih polos, seperti orang bicara sehari-hari".

> Jangan pernah mengirim tulisan yang isinya tidak kamu pahami atau tidak kamu setujui. Yang bertanggung jawab atas pesan itu tetap namamu, bukan nama AI-nya.`,
    },
    {
      title: "Memahami dokumen dengan AI",
      contentMd: `## Dokumen yang bikin ngantuk sebelum paragraf ketiga

Perjanjian sewa, syarat dan ketentuan aplikasi, SOP kantor, surat edaran sekolah, polis asuransi. Bukan karena kamu tidak mampu membacanya, tapi karena bahasanya memang padat. Di sinilah AI paling cepat terasa manfaatnya: tempel isinya, lalu bertanyalah seperti ke teman yang sabar.

## Lima pertanyaan standar untuk dokumen apa pun

1. Ringkas dokumen ini jadi lima poin dengan bahasa sehari-hari.
2. Apa saja KEWAJIBANKU di sini, dan kapan tenggatnya?
3. Bagian mana yang berpotensi merugikan aku, dan kenapa?
4. Istilah apa saja yang biasanya tidak dipahami orang awam? Jelaskan satu per satu.
5. Hal penting apa yang TIDAK diatur di dokumen ini?

Pertanyaan kelima sering paling berharga — yang tidak tertulis biasanya yang jadi masalah belakangan.

## Batas yang harus kamu pegang

Kalau dokumennya panjang, potong per bagian lalu minta ringkasan gabungan di akhir. Samarkan dulu nama, NIK, dan nomor rekening (lihat materi daftar merah). Dan yang paling penting: nomor pasal serta angka rupiah yang disebut AI WAJIB kamu cocokkan sendiri ke dokumen aslinya.

> AI bukan pengacara, bukan notaris, bukan petugas pajak. Ia bagus untuk membuatmu PAHAM sebelum bertanya ke ahlinya — bukan untuk menggantikan ahlinya saat tanda tangan sudah di depan mata.`,
    },
    {
      title: "Belajar hal baru dengan AI sebagai tutor",
      contentMd: `## Tutor yang tidak pernah bosan ditanya

Kelebihan AI sebagai teman belajar bukan karena ia paling pintar, tapi karena ia tidak pernah kesal saat kamu menanyakan hal yang sama untuk kelima kalinya. Manfaatkan itu — jangan malu bertanya dari titik paling dasar.

## Naik bertingkat, jangan langsung ke puncak

    Jelaskan [topik] seperti kepada anak SMP, pakai satu analogi sehari-hari.
    Lalu: sekarang jelaskan versi yang lebih dalam, sebutkan istilah resminya.
    Lalu: apa kesalahpahaman paling umum tentang topik ini?

Tiga langkah itu jauh lebih nempel daripada sekali minta penjelasan lengkap yang langsung padat.

## Dua teknik yang bikin ingatannya bertahan

- **Minta soal, bukan jawaban.** "Beri lima soal latihan tentang topik ini, jangan beri jawabannya dulu." Kerjakan sendiri, baru minta dinilai dan dijelaskan yang salah.
- **Jelaskan balik.** Tulis pemahamanmu sendiri, lalu minta: "Cari bagian yang keliru atau kurang tepat dari penjelasanku." Menemukan lubang di pemahaman sendiri jauh lebih cepat daripada membaca ulang.

## Jujur soal batasnya

Untuk materi yang harus akurat — sejarah, hukum, rumus, kesehatan — cocokkan dengan sumber gratis yang bisa dilacak: Wikipedia untuk gambaran awal, Khan Academy untuk matematika dan sains, buku pelajaran resmi untuk anak sekolah. Dan kalau kamu belajar untuk ujian atau tugas: minta AI menemanimu berlatih, bukan mengerjakan untukmu. Yang harus bisa di hari-H itu kamu.`,
      links: [
        { label: "Khan Academy (gratis)", url: "https://www.khanacademy.org" },
        { label: "Wikipedia Bahasa Indonesia", url: "https://id.wikipedia.org" },
      ],
    },
    {
      title: "Langkah berikutnya di platform ini",
      contentMd: `## Apa yang sudah kamu punya sekarang

Sampai di sini, kamu sudah memegang lima hal yang membedakan pemakai AI yang sadar dari yang asal pakai: tahu apa itu AI dan LLM, paham kasar cara kerjanya, tahu batas dan risikonya, bisa membaca jawaban secara kritis, dan bisa bertanya lanjutan. Itu fondasinya. Sisanya tinggal memilih jalur.

## Peta kelas lanjutan

| Kalau kebutuhanmu… | Ambil kelas |
| --- | --- |
| Jawaban AI sering meleset dari yang kamu mau | Prompt Engineering Praktis |
| Kerjaan kantor: email, dokumen, rapat, spreadsheet | AI untuk Produktivitas Kerja |
| Punya data penjualan atau survei yang belum terbaca | Analisis Data dengan AI |
| Ingin membangun aplikasi web sendiri | Bikin Aplikasi Web dengan AI |
| Sudah bisa membangun, mau menjalankan banyak agent | Orkestrasi Multi-Agent |

Dua kelas terakhir jauh lebih berat. Tidak apa-apa kalau belum ke sana sekarang.

## Kebiasaan yang membuat semua ini nyangkut

Satu tugas nyata per hari, bukan latihan buatan — pakai AI untuk pekerjaan yang memang sedang ada di mejamu. Simpan prompt yang berhasil di catatan HP-mu; dalam sebulan kamu punya perpustakaan pribadi yang lebih berguna daripada kumpulan prompt siapa pun di internet.

> Terakhir: bertanyalah di tab Diskusi. Platform ini gratis dan jalan bareng-bareng — pertanyaan "dasar" yang kamu kira memalukan biasanya dipendam sepuluh orang lain juga.`,
    },
  ],
  quizzes: [
    {
      title: "Kuis: Dasar AI",
      passingScorePct: 60,
      questions: [
        {
          prompt: "Apa kepanjangan dari LLM?",
          options: ["Large Language Model", "Long Learning Machine", "Linked Logic Model", "Low-Level Memory"],
          correctIndex: 0,
          explanation: "LLM = Large Language Model — model bahasa berukuran besar.",
        },
        {
          prompt: "LLM menghasilkan jawaban terutama dengan cara…",
          options: [
            "Mencari di database fakta",
            "Memprediksi token berikutnya dari pola",
            "Menyalin dari Wikipedia",
            "Bertanya ke operator manusia",
          ],
          correctIndex: 1,
          explanation: "LLM memprediksi token paling mungkin, bukan mengambil dari database.",
        },
        {
          prompt: "Mana pernyataan yang PALING tepat tentang LLM?",
          options: ["Selalu akurat", "Tak pernah salah", "Bisa salah dengan percaya diri", "Tak perlu diverifikasi"],
          correctIndex: 2,
          explanation: "Karena memperkirakan, LLM bisa keliru meski terdengar meyakinkan.",
        },
        {
          prompt: "'Context window' artinya…",
          options: ["Ukuran layar", "Batas token yang bisa diproses sekaligus", "Jenis kata", "Nama aplikasi"],
          correctIndex: 1,
        },
      ],
    },
  ],
};
