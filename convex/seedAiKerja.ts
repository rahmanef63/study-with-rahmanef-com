// Seed kurikulum "AI untuk Produktivitas Kerja" — untuk karyawan/pekerja
// kantoran non-IT yang mau kerja lebih cepat pakai asisten AI, semuanya gratis.
// Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedAiKerja:seedAiKerjaContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
//
// Idempoten per course: slug yang sudah ada dilewati utuh. Catatan konten:
// code/prompt sample memakai INDENTED code block (4 spasi, CommonMark) agar
// bebas backtick di template literal.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

type L = { title: string; contentMd: string; links?: { label: string; url: string }[] };
type Q = {
  title: string;
  passingScorePct: number;
  questions: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[];
};
type M = { title: string; lessons: L[]; quiz?: Q };
type C = { slug: string; title: string; description: string; modules: M[] };

const COURSE: C = {
  slug: "ai-produktivitas-kerja",
  title: "AI untuk Produktivitas Kerja",
  description:
    "Untuk karyawan dan pekerja kantoran non-IT yang mau kerja lebih cepat pakai asisten AI — menulis, dokumen, spreadsheet, rapat — tanpa jargon, semuanya gratis.",
  modules: [
    {
      title: "Asisten AI di Tempat Kerja",
      lessons: [
        {
          title: "Kenalan & Pilih Asisten AI Gratis (Claude, ChatGPT, Gemini)",
          contentMd: `## Anggap dia asisten baru yang super cepat

Asisten AI seperti Claude, ChatGPT, dan Gemini itu seperti punya asisten baru yang bisa membaca dan menulis dalam hitungan detik — tapi baru berguna kalau kamu kasih instruksi yang jelas. Tidak ada satu pun dari mereka yang "paling benar"; ketiganya punya tingkat gratis (free tier) yang cukup untuk kerja kantoran sehari-hari.

## Tiga pilihan gratis yang paling umum

- **Claude** (claude.ai) — kuat untuk menulis panjang & mengikuti instruksi detail.
- **ChatGPT** (chatgpt.com) — paling banyak dipakai, ekosistem luas.
- **Gemini** (gemini.google.com) — enak kalau kamu sudah pakai Google Docs/Sheets/Gmail.

Semua punya batas pemakaian gratis (jumlah pesan per hari/jam). Kalau satu alat sedang penuh, pindah sebentar ke yang lain — isi pekerjaannya sama saja.

## Langkah pertama yang aman

1. Daftar pakai email yang kamu nyaman bagikan (idealnya bukan email kerja, kecuali kantor sudah mengizinkan/menyediakan akun resmi).
2. Coba satu tugas kecil dulu: "ringkas paragraf ini jadi 3 poin" — rasakan gaya jawabannya.
3. Simpan alat yang paling cocok dengan cara kerjamu sebagai andalan; yang lain jadi cadangan.

> Kamu tidak perlu jago teknis untuk mulai. Targetmu di modul ini: berani mencoba, dan tahu batas amannya (lanjut ke lesson berikut).`,
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "ChatGPT", url: "https://chatgpt.com" },
            { label: "Gemini", url: "https://gemini.google.com" },
          ],
        },
        {
          title: "Akun Kerja & Privasi Data: Apa yang Boleh dan Tidak Ditempel",
          contentMd: `## Aturan nomor satu: JANGAN tempel data rahasia

Sebelum lanjut lebih jauh, ini yang paling penting di seluruh kursus ini: chat AI gratis BUKAN tempat aman untuk data rahasia kantor. Perlakukan kotak chat seperti pesan ke orang asing — jangan taruh apa pun yang tidak boleh bocor.

## Tiga pertanyaan sebelum menempel apa pun

1. **Apakah ini rahasia perusahaan atau klien** (harga khusus, strategi, kontrak, kredensial)? Kalau ya — jangan tempel.
2. **Apakah ada data pribadi yang bisa mengenali seseorang** (nama lengkap + nomor identitas, gaji, data kesehatan)? Kalau ya — anonimkan dulu (ganti nama jadi "Klien A", hapus angka identitas) atau jangan tempel.
3. **Apakah kebijakan kantorku mengizinkan ini?** Kalau ragu — tanyakan ke atasan atau tim IT, jangan menebak sendiri.

## Contoh aman vs tidak aman

Aman: "Tolong perbaiki tata bahasa email ini" (isi email sudah bersih dari data rahasia).
Tidak aman: menempel spreadsheet gaji karyawan, nomor rekening klien, atau kredensial login apa pun.

## Cek pengaturan privasi

Sebagian besar alat AI punya pengaturan untuk membatasi apakah percakapanmu dipakai melatih model — cek menu **Settings/Privacy** di akunmu dan sesuaikan sesuai kenyamananmu, meski aturan utama tetap: kalau ragu, jangan tempel.`,
          links: [
            { label: "Kebijakan Privasi Anthropic (Claude)", url: "https://www.anthropic.com/legal/privacy" },
            { label: "Kebijakan Privasi OpenAI (ChatGPT)", url: "https://openai.com/policies/privacy-policy" },
            { label: "Kebijakan Privasi Google", url: "https://policies.google.com/privacy" },
          ],
        },
        {
          title: "Prompt Dasar yang Langsung Berguna di Kerjaan",
          contentMd: `## Prompt = instruksi kerja, bukan mantra

Prompt yang bagus itu seperti briefing ke rekan kerja baru: jelaskan perannya, tugasnya, dan format hasil yang kamu mau. Semakin jelas briefingmu, semakin sedikit revisi yang kamu perlukan.

## Pola sederhana yang bisa langsung dipakai

    [PERAN] Kamu asisten admin/marketing/HR (sesuaikan).
    [KONTEKS] Ini situasinya: (jelaskan singkat)
    [TUGAS] Tolong buatkan/ringkas/perbaiki ...
    [FORMAT] Balas dalam bentuk: poin-poin / paragraf pendek / tabel

Contoh nyata:

    Kamu asisten admin kantor. Aku mau kirim pengingat rapat besok jam 10 ke
    tim marketing, isinya agenda dan link Zoom. Tolong tuliskan pesan singkat
    yang sopan tapi tidak kaku, maksimal 5 kalimat.

## Kebiasaan yang bikin hasil makin bagus

- **Iterasi**: kalau hasil pertama belum pas, jangan mulai dari nol — bilang "buat lebih singkat" atau "nadanya terlalu formal, buat lebih santai".
- **Minta beberapa pilihan** kalau butuh variasi: "beri 3 versi kalimat pembuka".
- **Koreksi terakhir tetap kamu** — baca ulang sebelum dikirim/dipakai, terutama nama orang dan angka.`,
          links: [
            { label: "Panduan prompt engineering Claude", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Asisten AI di Tempat Kerja",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Sebelum menempelkan data ke asisten AI gratis, yang paling penting kamu pastikan adalah…",
            options: [
              "Ukuran file yang ditempel",
              "Warna tema aplikasi yang dipakai",
              "Data tersebut bebas dari rahasia perusahaan/data pribadi sensitif",
              "Jumlah kata dalam data",
            ],
            correctIndex: 2,
            explanation: "Chat AI gratis bukan tempat aman untuk data rahasia — cek dulu sebelum menempel apa pun.",
          },
          {
            prompt: "Manakah yang TERMASUK contoh aman ditempel ke asisten AI gratis?",
            options: [
              "Nomor rekening klien",
              "Password sistem internal",
              "Data gaji karyawan",
              "Draft email yang sudah bersih dari identitas/data rahasia",
            ],
            correctIndex: 3,
            explanation: "Selama isinya sudah dianonimkan/tidak rahasia, draft tulisan aman diproses AI.",
          },
          {
            prompt: "Prompt yang baik untuk kerja biasanya mencantumkan…",
            options: [
              "Konteks (siapa/apa), tugas jelas, dan format hasil yang diinginkan",
              "Hanya satu kata kunci tanpa konteks apa pun",
              "Emoji sebanyak mungkin",
              "Tidak perlu apa-apa, AI selalu tahu maksudmu",
            ],
            correctIndex: 0,
            explanation: "Semakin jelas peran, konteks, tugas, dan format yang diminta, semakin sedikit revisi dibutuhkan.",
          },
          {
            prompt: "Kalau kantor punya kebijakan data resmi soal pemakaian AI, sikap paling tepat adalah…",
            options: [
              "Abaikan karena AI dianggap lebih pintar",
              "Bagikan data ke banyak alat AI sekaligus biar cepat",
              "Ikuti kebijakan data kantor, tanyakan ke atasan/IT bila ragu",
              "Pakai akun pribadi untuk data kantor tanpa izin",
            ],
            correctIndex: 2,
            explanation: "Kebijakan kantor dan konfirmasi ke atasan/IT selalu lebih diutamakan daripada asumsi sendiri.",
          },
        ],
      },
    },
    {
      title: "Menulis Lebih Cepat",
      lessons: [
        {
          title: "Email Profesional dalam Bahasa Indonesia & Inggris",
          contentMd: `## Email adalah pekerjaan yang paling sering berulang

Sebagian besar email kerja punya pola yang mirip: sapaan, maksud, detail, penutup. Asisten AI sangat kuat untuk pola berulang seperti ini — kamu tinggal kasih maksud dan konteksnya.

## Pola prompt untuk email

    Tolong tuliskan email [bahasa: Indonesia/Inggris] ke [penerima],
    tujuannya [maksud email], nadanya [formal/ramah/tegas],
    poin yang harus ada: [poin 1, poin 2, ...]
    Panjang: singkat, maksimal 6 kalimat.

Contoh: "Tuliskan email bahasa Inggris ke vendor, tujuannya menanyakan status pengiriman yang telat 3 hari, nadanya sopan tapi tegas, poin yang harus ada: nomor invoice dan tenggat baru yang kami minta."

## Untuk email Bahasa Inggris

Kalau bahasa Inggrismu belum lancar, minta AI menulis draft dulu, lalu minta dijelaskan kalau ada kalimat yang terasa asing — ini sekaligus cara belajar sambil kerja. Selalu baca ulang sebelum kirim, terutama nama orang dan angka/tanggal.`,
          links: [
            { label: "Google Docs (gratis)", url: "https://docs.google.com" },
            { label: "Grammarly (gratis)", url: "https://www.grammarly.com" },
          ],
        },
        {
          title: "Meringkas Dokumen Panjang Jadi Poin Penting",
          contentMd: `## Dari 10 halaman jadi 5 baris

Salah satu manfaat paling langsung dari AI di kerjaan: membaca dokumen panjang untukmu dan mengeluarkan intinya. Tempel isi dokumen (atau bagian yang relevan), lalu minta format ringkasan yang kamu butuhkan.

## Format ringkasan yang sering dipakai

    Ringkas dokumen ini menjadi:
    - 3-5 poin utama
    - keputusan yang diambil (kalau ada)
    - hal yang perlu tindak lanjut

Variasi lain: "buatkan TL;DR satu paragraf", "ringkas khusus bagian anggaran saja", "bandingkan poin A dan B di dokumen ini".

## Kalau dokumennya sangat panjang

Beberapa alat gratis punya batas jumlah teks yang bisa ditempel sekaligus. Kalau dokumen terlalu panjang: bagi per bab/bagian, ringkas satu-satu, lalu minta AI menggabungkan ringkasan-ringkasan itu jadi satu ringkasan akhir.

> Selalu cek angka dan nama penting di ringkasan — AI bisa salah kutip; ringkasan mempercepat membaca, bukan menggantikan verifikasi.`,
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "ChatGPT", url: "https://chatgpt.com" },
          ],
        },
        {
          title: "Proposal, Laporan, dan Menyesuaikan Nada (Formal vs Santai)",
          contentMd: `## Mulai dari kerangka, baru isi

Dokumen besar seperti proposal atau laporan paling enak dibuat dua tahap: minta AI membuat KERANGKA dulu (daftar bagian + isi singkat tiap bagian), kamu setujui/sunting kerangkanya, baru minta AI mengisi tiap bagian secara detail.

    Buatkan kerangka proposal untuk [tujuan proposal], targetnya [pembaca],
    bagian yang wajib ada: latar belakang, tujuan, rencana, anggaran, penutup.

## Formal vs santai — dua "kostum" tulisan yang sama

- **Formal**: sapaan resmi, kalimat lengkap, jarang singkatan — cocok untuk atasan, klien baru, dokumen resmi.
- **Santai**: sapaan akrab, kalimat lebih pendek, boleh sedikit ekspresif — cocok untuk tim internal yang sudah dekat.

Minta AI menulis dua versi lalu bandingkan, atau minta "ubah nadanya jadi lebih santai/formal" dari draft yang sudah ada — jauh lebih cepat daripada menulis ulang dari nol.

## Sebelum dikirim

Baca ulang seluruh dokumen, pastikan angka dan klaim sesuai fakta nyata, dan sesuaikan bagian yang terasa "generik" dengan detail khas situasimu.`,
          links: [
            { label: "Google Docs (gratis)", url: "https://docs.google.com" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Menulis Lebih Cepat",
        passingScorePct: 65,
        questions: [
          {
            prompt: "Saat minta AI menulis email resmi, elemen yang WAJIB kamu berikan adalah…",
            options: [
              "Tujuan email, konteks singkat, dan nada yang diinginkan (formal/santai)",
              "Nama font yang dipakai",
              "Jumlah huruf kapital",
              "Waktu pengiriman saja",
            ],
            correctIndex: 0,
            explanation: "Tanpa tujuan, konteks, dan nada, hasil draft AI cenderung generik dan butuh banyak revisi.",
          },
          {
            prompt: "Cara paling efektif meringkas dokumen panjang dengan AI adalah…",
            options: [
              "Menghapus seluruh isi dokumen",
              "Membaca ulang manual tanpa bantuan apa pun",
              "Menerjemahkan ke bahasa asing dulu",
              "Tempel dokumen (atau bagian relevan), minta poin-poin utama sesuai kebutuhan",
            ],
            correctIndex: 3,
            explanation: "Menempel isi lalu meminta format ringkasan yang spesifik adalah cara paling langsung dan cepat.",
          },
          {
            prompt: "Perbedaan nada formal dan santai dalam tulisan terletak pada…",
            options: [
              "Panjang paragraf saja",
              "Ukuran file dokumen",
              "Pilihan kata, sapaan, dan tingkat keakraban kalimat",
              "Jenis font yang dipakai",
            ],
            correctIndex: 2,
            explanation: "Nada ditentukan oleh diksi dan gaya sapaan, bukan format visual dokumen.",
          },
          {
            prompt: "Setelah AI membuat draft proposal/laporan, langkah selanjutnya yang paling penting adalah…",
            options: [
              "Langsung kirim tanpa dibaca ulang",
              "Hapus semua dan mulai dari nol",
              "Minta AI menandatangani atas namamu",
              "Baca ulang, sesuaikan fakta & angka, pastikan cocok konteks nyata",
            ],
            correctIndex: 3,
            explanation: "Draft AI adalah titik awal — verifikasi fakta dan angka tetap tanggung jawab manusia.",
          },
        ],
      },
    },
    {
      title: "Spreadsheet & Data Ringan",
      lessons: [
        {
          title: "Minta AI Membuatkan Formula Excel/Sheets",
          contentMd: `## Jelaskan masalahnya, bukan cuma minta "rumus"

AI jauh lebih akurat kalau kamu jelaskan STRUKTUR datamu dulu (nama kolom, contoh isi tanpa data rahasia) baru minta rumus, dibanding cuma bilang "buatkan rumus VLOOKUP".

    Aku punya spreadsheet dengan kolom: A=Nama Produk, B=Kategori, C=Jumlah Terjual.
    Tolong buatkan rumus untuk menjumlahkan Jumlah Terjual per Kategori,
    dan jelaskan cara pakainya langkah demi langkah.

## Formula yang paling sering dibutuhkan kerjaan kantoran

- **SUM/SUMIF/SUMIFS** — total dengan syarat.
- **VLOOKUP/XLOOKUP** — cari data dari tabel lain.
- **IF/IFS** — logika bersyarat sederhana ("kalau lebih dari target, tulis Tercapai").
- **COUNTIF** — hitung kemunculan sesuatu.

## Selalu minta penjelasan, bukan cuma rumusnya

Minta AI menjelaskan APA fungsi tiap bagian rumus ("apa arti $A$2 di sini?") — supaya kamu bisa memperbaikinya sendiri kalau datanya berubah, tanpa harus tanya AI lagi tiap saat.`,
          links: [
            { label: "Daftar fungsi Google Sheets", url: "https://support.google.com/docs/table/25273" },
            { label: "Referensi rumus Excel (Exceljet, gratis)", url: "https://exceljet.net/formulas" },
          ],
        },
        {
          title: "Merapikan Data yang Berantakan",
          contentMd: `## Data berantakan itu normal, bukan aib

Data hasil ekspor sistem, form, atau gabungan banyak orang biasanya berantakan: format tanggal beda-beda, spasi berlebih, huruf besar/kecil tidak konsisten, baris duplikat. AI bisa membantu MERANCANG langkah membersihkannya, bahkan tanpa perlu kamu menempel data aslinya.

    Data penjualanku punya masalah: tanggal ada yang format DD/MM/YYYY ada
    yang MM-DD-YYYY, dan ada baris yang duplikat persis. Tolong jelaskan
    langkah membersihkannya di Google Sheets/Excel, urut dari yang paling aman.

## Fitur bawaan yang sering dilupakan

- **Hapus Duplikat** (Data > Hapus duplikat / Remove duplicates).
- **Pisahkan Teks ke Kolom** (Text to Columns) untuk data yang tergabung di satu sel.
- **Format tanggal konsisten** lewat Format > Angka > Tanggal.

## Kalau data berisi info sensitif

Ingat lesson privasi di Modul 1: jangan tempel data asli yang berisi identitas/rahasia ke chat AI. Cukup jelaskan STRUKTUR masalahnya (nama kolom, jenis masalah) — AI tetap bisa membantu tanpa perlu melihat datanya.`,
          links: [
            { label: "Hapus duplikat di Google Sheets", url: "https://support.google.com/docs/answer/3540681" },
          ],
        },
        {
          title: "Pivot Sederhana & Template Gratis",
          contentMd: `## Pivot table = mesin rangkum otomatis

Pivot table mengelompokkan dan menjumlahkan data besar jadi tabel ringkas — misalnya total penjualan per bulan per produk, tanpa rumus manual satu-satu. Kamu tidak perlu hafal caranya; minta AI menuntunmu langkah demi langkah sesuai datamu.

    Aku punya data transaksi dengan kolom Tanggal, Produk, Jumlah, Total.
    Tolong tuntun aku langkah demi langkah membuat pivot table di Google
    Sheets untuk melihat Total per bulan per Produk.

## Kapan pakai template siap pakai

Untuk kebutuhan umum (anggaran bulanan, jadwal konten, tracker proyek), sering lebih cepat pakai TEMPLATE GRATIS yang sudah ada daripada bikin dari nol — lalu minta AI menyesuaikan template itu dengan kebutuhanmu.

## Kebiasaan yang menghemat waktu

Simpan spreadsheet yang sudah rapi sebagai template pribadi untuk laporan berikutnya — kamu tinggal ganti angka, struktur & pivotnya sudah jadi.`,
          links: [
            { label: "Pivot table di Google Sheets", url: "https://support.google.com/docs/answer/1272900" },
            { label: "Template gratis (Vertex42)", url: "https://www.vertex42.com" },
          ],
        },
      ],
    },
    {
      title: "Rapat & Kolaborasi",
      lessons: [
        {
          title: "Menyiapkan Agenda Rapat yang Fokus",
          contentMd: `## Rapat tanpa agenda = waktu yang bocor

Agenda yang jelas membuat rapat lebih singkat dan tidak melebar. Kamu cukup kasih AI catatan kasar (topik apa saja yang perlu dibahas), minta disusun jadi agenda rapi dengan alokasi waktu.

    Aku mau rapat 30 menit dengan tim, topiknya: update progres proyek X,
    kendala budget, dan rencana minggu depan. Tolong susun jadi agenda
    dengan alokasi waktu per topik dan tujuan/hasil yang diharapkan tiap topik.

## Elemen agenda yang baik

- **Topik** — apa yang dibahas.
- **Waktu** — berapa menit dialokasikan (mencegah satu topik memakan semua waktu).
- **Tujuan/hasil** — apa yang harus dihasilkan di akhir topik itu (keputusan? daftar tugas?).

## Kirim agenda sebelum rapat

Bagikan agenda ke peserta sebelum rapat dimulai — orang datang lebih siap, dan kamu punya alasan kuat untuk mengarahkan diskusi kembali kalau melebar.`,
          links: [
            { label: "Google Docs (gratis)", url: "https://docs.google.com" },
          ],
        },
        {
          title: "Notulen Otomatis dari Transkrip + Follow-up Action Items",
          contentMd: `## Transkrip dulu, notulen kemudian

Banyak alat rapat gratis (Google Meet, Zoom versi gratis) punya fitur teks otomatis (caption/transcript) yang bisa disalin. Ada juga alat khusus transkripsi gratis seperti Otter.ai. Setelah kamu punya teks mentahnya, AI bisa merapikannya jadi notulen dalam hitungan detik.

    Ini transkrip rapat kami (tempel transkrip yang sudah bersih dari data
    rahasia). Tolong buatkan notulen singkat berisi: poin pembahasan utama,
    keputusan yang diambil, dan daftar action item (tugas, penanggung jawab,
    tenggat) dari transkrip ini.

## Action item yang jelas = tindak lanjut yang jalan

Action item yang baik punya tiga bagian: TUGAS apa, SIAPA penanggung jawabnya, dan KAPAN tenggatnya. Minta AI melengkapi bagian yang kosong dari konteks percakapan, lalu kamu konfirmasi ke penanggung jawab masing-masing.

> Ingat aturan privasi: kalau transkrip berisi hal rahasia/sensitif, anonimkan dulu bagian itu sebelum ditempel ke AI.`,
          links: [
            { label: "Otter.ai (transkripsi gratis)", url: "https://otter.ai" },
            { label: "Bantuan teks otomatis Google Meet", url: "https://support.google.com/meet" },
          ],
        },
        {
          title: "Menyusun Outline Presentasi dari Hasil Rapat",
          contentMd: `## Dari notulen ke slide dalam beberapa menit

Notulen dan action item dari lesson sebelumnya adalah bahan mentah presentasi yang sempurna. Minta AI menyusunnya jadi OUTLINE presentasi (judul tiap slide + poin singkat), bukan langsung teks penuh — supaya slide tetap ringkas dan enak dibaca.

    Dari notulen ini (tempel notulen), buatkan outline presentasi 6 slide:
    latar belakang, temuan utama, kendala, rencana, kebutuhan dukungan,
    dan langkah berikutnya. Tiap slide cukup judul + 3 poin singkat.

## Alat gratis untuk merapikan tampilan

Setelah outline jadi, salin ke Google Slides atau Canva (punya template presentasi gratis) untuk merapikan tampilan visualnya. Beberapa alat seperti Gamma juga punya versi gratis yang bisa langsung mengubah outline teks jadi slide bergaya.

## Tips presentasi hasil AI

Jangan copy seluruh kalimat panjang ke slide — slide untuk poin, penjelasan detail untuk ucapanmu saat presentasi.`,
          links: [
            { label: "Canva (gratis)", url: "https://www.canva.com" },
            { label: "Gamma (ada tingkat gratis)", url: "https://gamma.app" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Rapat & Kolaborasi",
        passingScorePct: 65,
        questions: [
          {
            prompt: "Agenda rapat yang baik sebaiknya mencantumkan…",
            options: [
              "Hanya judul rapat",
              "Daftar menu konsumsi rapat",
              "Topik, waktu per topik, dan tujuan/hasil yang diharapkan",
              "Nama seluruh karyawan perusahaan",
            ],
            correctIndex: 2,
            explanation: "Topik, alokasi waktu, dan tujuan yang jelas mencegah rapat melebar tanpa arah.",
          },
          {
            prompt: "Untuk membuat notulen dari transkrip rapat, langkah yang tepat adalah…",
            options: [
              "Menghapus transkrip lalu mengarang notulen",
              "Mengirim transkrip mentah ke semua peserta tanpa diringkas",
              "Menunggu ingatan sendiri saja",
              "Tempel transkrip (yang sudah bersih) ke AI, minta ringkasan poin & keputusan",
            ],
            correctIndex: 3,
            explanation: "Transkrip adalah bahan mentah yang paling akurat untuk diringkas AI menjadi notulen.",
          },
          {
            prompt: "Action item yang baik biasanya berisi…",
            options: [
              "Hanya nama tugas tanpa penanggung jawab",
              "Emoji lucu di setiap baris",
              "Tugas, penanggung jawab, dan tenggat waktu yang jelas",
              "Daftar peserta rapat saja",
            ],
            correctIndex: 2,
            explanation: "Tanpa penanggung jawab dan tenggat, action item cenderung tidak pernah ditindaklanjuti.",
          },
          {
            prompt: "Outline presentasi dari hasil rapat sebaiknya disusun…",
            options: [
              "Menempel seluruh isi notulen apa adanya",
              "Ringkas & mengikuti alur logis (latar belakang → temuan → langkah berikutnya)",
              "Tanpa struktur, bebas urutan",
              "Hanya berisi gambar tanpa teks sama sekali",
            ],
            correctIndex: 1,
            explanation: "Outline yang ringkas dan runtut lebih mudah diikuti audiens dibanding notulen mentah.",
          },
        ],
      },
    },
    {
      title: "Otomasi Ringan & Etika",
      lessons: [
        {
          title: "Template Prompt yang Bisa Dipakai Ulang & Membangun Kebiasaan",
          contentMd: `## Prompt bagus layak dipakai berkali-kali

Kalau kamu sudah menemukan prompt yang hasilnya pas untuk tugas berulang (mis. notulen mingguan, ringkasan laporan bulanan), simpan sebagai TEMPLATE — jangan menulis ulang dari nol setiap kali.

    Template notulen rapat:
    "Dari transkrip berikut (tempel di sini), buatkan notulen dengan
    format: poin pembahasan, keputusan, action item (tugas/PIC/tenggat).
    Gunakan bahasa Indonesia yang ringkas dan profesional."

## Bangun "perpustakaan prompt" pribadi

Kumpulkan template-templatemu di satu tempat gratis (Google Docs, Notion versi gratis, atau catatan biasa), kelompokkan per jenis tugas (email, ringkasan, notulen, laporan). Setiap kali menemukan versi yang lebih baik, perbarui templatenya.

## Kebiasaan kecil, dampak besar

- Sisihkan 5 menit tiap minggu untuk meninjau template mana yang paling sering dipakai/gagal.
- Bagikan template yang berhasil ke rekan tim — mempercepat semua orang, bukan cuma kamu.`,
          links: [
            { label: "Notion (gratis untuk personal)", url: "https://www.notion.com" },
            { label: "Google Docs (gratis)", url: "https://docs.google.com" },
          ],
        },
        {
          title: "Batas AI di Kerjaan: Verifikasi, Bias, dan Data Sensitif",
          contentMd: `## AI itu asisten cepat, bukan sumber kebenaran mutlak

Tiga batas yang wajib kamu ingat setiap kali memakai AI di kerjaan:

1. **Verifikasi** — AI bisa "mengarang dengan percaya diri" (halusinasi), terutama untuk angka, tanggal, atau kutipan. Sebelum dipakai di laporan resmi, cek ke sumber aslinya.
2. **Bias** — jawaban AI dipengaruhi data latihnya dan cara kamu bertanya; hasil bisa condong ke satu sudut pandang. Kalau topiknya sensitif (mis. menilai orang), tambahkan tinjauan manusia, jangan serahkan keputusan penuh ke AI.
3. **Data sensitif** — aturan dari Modul 1 tetap berlaku selamanya: tidak ada data rahasia/pribadi yang ditempel ke chat AI publik, sepenting apa pun kecepatannya.

## Checklist singkat sebelum memakai hasil AI

- Apakah angka/faktanya sudah kucek ke sumber asli?
- Apakah ada bagian yang butuh sudut pandang manusia (bukan cuma pola data)?
- Apakah tidak ada data rahasia yang ikut tertempel?

## Menutup kursus ini

Kamu sudah punya dasar untuk menulis lebih cepat, mengolah spreadsheet, menyiapkan rapat, dan menyusun template sendiri — semuanya dengan alat gratis. Teruskan kebiasaan ini: simpan template yang berhasil, rutin verifikasi hasil, dan jaga data sensitif. Kalau ingin belajar lebih jauh, lanjutkan ke kelas lain di komunitas ini.`,
          links: [
            { label: "Kebijakan Privasi Anthropic (Claude)", url: "https://www.anthropic.com/legal/privacy" },
            { label: "Kebijakan Privasi Google", url: "https://policies.google.com/privacy" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Otomasi Ringan & Etika",
        passingScorePct: 70,
        questions: [
          {
            prompt: "Template prompt yang bisa dipakai ulang paling berguna untuk…",
            options: [
              "Tugas yang hanya dilakukan sekali seumur hidup",
              "Mengganti seluruh pekerjaan tanpa pengecekan",
              "Menghindari belajar prompt sama sekali",
              "Tugas berulang dengan pola serupa (mis. notulen tiap minggu)",
            ],
            correctIndex: 3,
            explanation: "Template paling menghemat waktu justru pada tugas yang berulang dengan pola serupa.",
          },
          {
            prompt: "Sebelum memakai angka/jawaban dari AI dalam laporan resmi, kamu WAJIB…",
            options: [
              "Percaya penuh tanpa verifikasi",
              "Menghapus sumber datanya",
              "Verifikasi ke sumber asli/data nyata karena AI bisa salah (halusinasi)",
              "Menambahkan emoji supaya lebih meyakinkan",
            ],
            correctIndex: 2,
            explanation: "AI bisa terdengar yakin padahal salah — verifikasi ke sumber asli tetap wajib.",
          },
          {
            prompt: "Bias pada hasil AI bisa muncul karena…",
            options: [
              "AI selalu netral sempurna tanpa kecuali",
              "Kecepatan internet yang dipakai",
              "Warna tema aplikasi yang dipilih",
              "Data latih dan cara prompt bisa membawa kecenderungan tertentu",
            ],
            correctIndex: 3,
            explanation: "Bias berasal dari data pelatihan dan framing prompt, bukan dari faktor teknis seperti internet.",
          },
          {
            prompt: "Kebiasaan sehat memakai AI di kerjaan jangka panjang adalah…",
            options: [
              "Pakai sesekali tanpa pernah dievaluasi",
              "Simpan & perbaiki template prompt, rutin verifikasi hasil, jaga data sensitif",
              "Bergantung penuh tanpa pernah mengecek",
              "Berhenti belajar karena AI dianggap sudah cukup",
            ],
            correctIndex: 1,
            explanation: "Kombinasi template yang terus diperbaiki, verifikasi rutin, dan menjaga data sensitif adalah kebiasaan yang bertahan lama.",
          },
        ],
      },
    },
  ],
};

export const seedAiKerjaContent = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.ownerEmail))
      .unique();
    if (user === null) throw new Error(`No user ${args.ownerEmail} — login + bootstrap first.`);
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();
    if (tenant === null) throw new Error(`No tenant ${args.tenantSlug} — run seed:bootstrap first.`);

    const existing = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenant._id).eq("slug", COURSE.slug))
      .unique();
    if (existing !== null) {
      return { skipped: true, courseSlug: COURSE.slug, note: "course already seeded" };
    }

    const courseId = await ctx.db.insert("courses", {
      tenantId: tenant._id,
      slug: COURSE.slug,
      title: COURSE.title,
      description: COURSE.description,
      status: "published",
      createdBy: user._id,
    });

    let moduleOrder = 1;
    let lessonTotal = 0;
    let quizTotal = 0;
    for (const mod of COURSE.modules) {
      const moduleId = await ctx.db.insert("modules", {
        tenantId: tenant._id,
        courseId,
        title: mod.title,
        order: moduleOrder++,
      });
      let lessonOrder = 1;
      for (const les of mod.lessons) {
        await ctx.db.insert("lessons", {
          tenantId: tenant._id,
          courseId,
          moduleId,
          title: les.title,
          contentMd: les.contentMd,
          links: les.links ?? [],
          order: lessonOrder++,
        });
        lessonTotal++;
      }
      if (mod.quiz) {
        await ctx.db.insert("quizzes", {
          tenantId: tenant._id,
          courseId,
          moduleId,
          title: mod.quiz.title,
          passingScorePct: mod.quiz.passingScorePct,
          questions: mod.quiz.questions,
        });
        quizTotal++;
      }
    }
    return {
      courseSlug: COURSE.slug,
      modules: COURSE.modules.length,
      lessons: lessonTotal,
      quizzes: quizTotal,
      note: "ai-produktivitas-kerja curriculum seeded (idempotent per course slug)",
    };
  },
});
