// Kurikulum "Freelance dari Nol" (komunitas karier-digital) — DATA saja.
//
// Alasan pemisahan sama dengan `karierPortofolioData.ts`: copy Bahasa Indonesia
// sepanjang ini hanya bebas dari plafon 200 LOC di glob `convex/_seed/*Data.ts`.
//
// DUA MATERI PERTAMA DISALIN PERSIS — judul adalah kunci idempotensi seed, dan
// menyunting isi materi yang sudah tayang tidak berpengaruh apa-apa di produksi
// (upsert hanya menyisipkan yang belum ada). Materi baru DITAMBAHKAN di ekor.
import type { SeedCurriculum } from "./curriculum";

export const KARIER_FREELANCE_CURRICULUM: SeedCurriculum = {
  slug: "freelance-nol",
  title: "Freelance dari Nol",
  description: "Dapat klien pertama tanpa koneksi orang dalam.",
  lessons: [
    {
      title: "Pilih niche & skill",
      contentMd: `## Niche bikin kamu dicari

Generalis susah dibedakan; spesialis gampang direkomendasikan.

- Pilih irisan: **skill yang kamu bisa × masalah yang dibayar orang.**
- Contoh: "desain feed IG untuk UMKM kuliner".`,
    },
    {
      title: "Cari klien pertama",
      contentMd: `## Tempat berburu

- **Jaringan terdekat** (teman, komunitas) — konversi tertinggi.
- **Marketplace** (Fiverr, Sribu) untuk isi portofolio awal.
- **Outbound**: DM bernilai, bukan spam "nawarin jasa".

## Tawaran yang menang

Fokus ke **hasil untuk klien**, bukan daftar fitur jasamu.`,
    },
    {
      title: "Tentukan paket dan harga pertamamu",
      contentMd: `## Jangan jual jam, jual paket

Menjual per jam menghukum kamu yang makin cepat. Jual **paket**: satu hasil jelas, satu harga, satu tenggat.

## Hitung lantai harganya dulu

Ini aritmetika sederhana, bukan patokan pasar — ganti angkanya dengan angkamu.

- Target penghasilan sebulan: Rp 6.000.000.
- Jam kerja yang benar-benar bisa ditagih: sekitar 60 jam sebulan (sisanya habis untuk cari klien, revisi, dan administrasi).
- Lantai tarifmu: 6.000.000 ÷ 60 = **Rp 100.000 per jam**.

Kalau satu paket kamu perkirakan makan 8 jam, harga di bawah Rp 800.000 berarti kamu membayari klien untuk bekerja.

## Riset pembanding, ambil tengahnya

Buka Sribu, Projects.co.id, atau Fiverr, cari 10 penyedia di nichemu, catat harganya. Ambil angka tengah, bukan yang termurah — yang termurah biasanya sedang buang-buang waktunya sendiri.

## Susun tiga tingkat

| Paket | Isi | Harga |
| --- | --- | --- |
| Hemat | satu hasil, tanpa revisi besar | lantai |
| Standar | hasil + 2 revisi | lantai × 1,6 |
| Lengkap | hasil + revisi + pendampingan singkat | lantai × 2,5 |

> Kalau klien menawar, jangan potong harga — **potong lingkupnya**. Harga yang turun tidak pernah naik lagi di mata klien yang sama.`,
      links: [
        { label: "Sribu", url: "https://www.sribu.com" },
        { label: "Projects.co.id", url: "https://projects.co.id" },
      ],
    },
    {
      title: "Menulis pesan penawaran yang dibalas",
      contentMd: `## Kenapa DM-mu tidak dibalas

Karena isinya tentang kamu. "Halo kak, saya freelancer desain, kalau butuh jasa boleh hubungi saya" tidak memberi alasan apa pun untuk membalas hari ini.

## Empat kalimat, tidak lebih

1. **Alasan spesifik** kamu menghubungi mereka — sebut sesuatu yang benar-benar kamu lihat.
2. **Satu bukti** yang relevan, dengan tautan langsung ke bagiannya.
3. **Satu usulan konkret dan kecil** yang bisa mereka bayangkan.
4. **Satu pertanyaan** yang gampang dijawab.

## Contoh yang bekerja

    Halo Pak Andi, saya lihat menu Warung Sedap masih dikirim
    lewat foto tulisan tangan di WhatsApp.
    Saya pernah merapikan hal yang sama untuk katering di Depok:
    [tautan], bagian "menu WhatsApp".
    Saya bisa buatkan satu halaman menu yang tinggal dikirim
    sebagai tautan, jadi tidak perlu foto ulang tiap harga berubah.
    Boleh saya kirim contohnya besok?

## Aturan lanjutan

- Susul **satu kali** setelah 4–5 hari kerja. Setelah itu berhenti; menghilang bukan berarti benci.
- Jangan kirim pesan yang sama ke 50 orang sekaligus. Sepuluh pesan yang dibaca menang jauh dari lima puluh yang di-skip.
- Kirim di jam kerja, bukan tengah malam.

> Simpan pesan yang pernah dibalas di satu catatan. Itu template pribadimu yang sudah terbukti.`,
    },
    {
      title: "Ngobrol pertama dengan calon klien",
      contentMd: `## Tugasmu bertanya, bukan presentasi

Obrolan pertama gagal kalau kamu menghabiskan 20 menit menjelaskan jasamu. Yang menang adalah yang paling paham masalah klien — dan itu cuma bisa didapat dengan bertanya.

## Tujuh pertanyaan yang selalu berguna

1. Apa yang bikin Bapak/Ibu mulai mencari bantuan sekarang?
2. Kalau ini berhasil, apa yang berubah dalam tiga bulan?
3. Kapan hasilnya dibutuhkan, dan kenapa tanggal itu?
4. Siapa yang ikut memutuskan selain Bapak/Ibu?
5. Pernah pakai jasa serupa sebelumnya? Apa yang kurang pas?
6. Bahan apa yang sudah ada, dan siapa yang mengirimnya ke saya?
7. Kisaran anggaran yang sudah disiapkan berapa?

## Cara menanyakan anggaran tanpa canggung

"Supaya saya tidak mengusulkan yang kejauhan, biasanya pekerjaan seperti ini di kisaran Rp 1–3 juta. Itu masih masuk atau perlu saya susun versi yang lebih ringkas?" Menyebut kisaranmu duluan bikin pertanyaannya terasa membantu, bukan menagih.

## Jangan pernah menyebut harga di tempat

Tutup dengan: "Saya rangkum dulu, besok saya kirim dua opsi." Kamu butuh waktu berhitung, dan penawaran tertulis selalu lebih dihargai daripada angka yang meluncur di telepon.

> Tanda bahaya sejak awal: "kita bicarakan bayarannya nanti kalau hasilnya bagus."`,
    },
    {
      title: "Kesepakatan kerja sederhana",
      contentMd: `## Bukan kontrak menakutkan, cukup satu halaman

Untuk pekerjaan kecil, satu email atau satu pesan WhatsApp yang dikonfirmasi sudah mencegah sebagian besar keributan. Yang penting bukan bahasa hukumnya, tapi **tertulis dan disetujui sebelum kamu mulai**.

## Enam baris yang wajib ada

| Baris | Contoh isi |
| --- | --- |
| Lingkup | 1 halaman menu digital, 8 produk |
| Tidak termasuk | fotografi produk, cetak, iklan |
| Hasil akhir | tautan aktif + file PDF |
| Revisi | 2 putaran, maksimal 7 hari setelah draf |
| Tenggat | 10 hari kerja sejak bahan lengkap diterima |
| Pembayaran | DP 50% di awal, pelunasan sebelum file final |

Baris "tidak termasuk" yang paling sering dilupakan, padahal dia yang menyelamatkanmu nanti.

## Cara mengunci persetujuan

Kirim enam baris itu apa adanya, lalu tutup dengan: "Kalau semua sudah sesuai, balas 'setuju' ya, biar saya mulai besok." Balasan satu kata itu bukti yang cukup untuk pekerjaan kecil.

## Kapan perlu lebih dari ini

Kalau nilainya besar, melibatkan hak cipta yang dipakai komersial luas, atau klien meminta kamu menandatangani dokumen panjang — baca pelan-pelan dan minta pendapat orang yang paham hukum. Jangan menandatangani sesuatu yang tidak kamu mengerti karena sungkan.

> Simpan semua kesepakatan di satu folder Google Drive per klien.`,
    },
    {
      title: "DP, invoice, dan menagih tanpa canggung",
      contentMd: `## Uang muka itu saringan, bukan kesombongan

Klien yang serius tidak keberatan membayar DP 50%. Yang keberatan biasanya memang tidak akan membayar di akhir. Untuk klien baru: DP di awal, pelunasan **sebelum** file final diserahkan.

## Isi invoice yang benar

- Nomor invoice dan tanggal terbit.
- Nama serta alamat penerima.
- Rincian pekerjaan, bukan cuma "jasa desain".
- Total dan tanggal jatuh tempo, misalnya 7 hari.
- Nomor rekening atas namamu sendiri.

Tidak perlu aplikasi berbayar. Buat satu template di Google Sheets, duplikat tiap kali dipakai, ekspor jadi PDF.

## Urutan menagih yang sopan tapi tegas

| Kapan | Yang kamu kirim |
| --- | --- |
| H-1 jatuh tempo | pengingat ramah, lampirkan ulang invoice |
| H+3 | "invoice nomor sekian sudah lewat jatuh tempo, mohon dibantu ya" |
| H+10 | sebut jelas pekerjaan berikutnya ditahan sampai pelunasan |

Kirim di jam kerja, singkat, tanpa minta maaf berlebihan. Menagih hakmu bukan perbuatan tidak sopan.

## Catat sejak hari pertama

Satu Google Sheets: tanggal, klien, nilai, status bayar. Selain memudahkanmu menagih, catatan ini yang kamu butuhkan saat mengurus pajak. Aturan pajak penghasilan untuk pekerja lepas ada di pajak.go.id — pelajari atau tanya langsung ke KPP, jangan menebak dari kata orang.`,
      links: [
        { label: "Direktorat Jenderal Pajak", url: "https://www.pajak.go.id" },
        { label: "Google Sheets", url: "https://docs.google.com/spreadsheets" },
      ],
    },
    {
      title: "Jaga proyek sehat: scope creep dan tanda bahaya",
      contentMd: `## Scope creep: pekerjaan yang membengkak diam-diam

Ciri khasnya kalimat kecil yang terdengar sepele. "Sekalian ya", "cuma ganti sedikit", "boleh minta versi untuk Instagram juga?" Satu permintaan memang sepele; sepuluh permintaan membuat tarifmu jatuh separuh tanpa pernah ada negosiasi.

## Kalimat penolak yang tidak bikin panas

    Boleh, itu di luar lingkup yang kita sepakati.
    Saya kirimkan penawaran tambahannya sore ini —
    sekitar Rp 300.000 dan menambah 2 hari kerja.
    Atau kalau mau tetap sesuai tenggat, kita simpan
    dulu untuk tahap berikutnya. Bapak pilih yang mana?

Kuncinya: jangan menolak, tapi beri harga. Klien yang baik akan memilih, klien yang bermasalah akan mundur — dua-duanya menguntungkanmu.

## Tanda bahaya sebelum menerima

- Minta contoh kerja besar dan gratis dulu.
- Tidak mau DP dengan alasan "kebijakan perusahaan" tapi tak ada dokumennya.
- Keputusan berganti terus karena tidak jelas siapa yang berwenang.
- Bilang "ini gampang kok" sambil menawar lebih dari separuh.
- Tenggat mustahil yang sudah lewat sebelum kamu diajak bicara.

Satu tanda masih bisa dibicarakan. Tiga tanda: tolak dengan sopan, dan tidak perlu menjelaskan panjang lebar.

> Kamu tetap akan kena sesekali. Setelah proyek selesai, tulis satu kalimat pelajaran dan tambahkan satu syarat baru di kesepakatanmu.`,
    },
    {
      title: "AI sebagai asisten freelance dan batasnya",
      contentMd: `## Pakai AI untuk bagian yang bikin lambat

Yang paling menghabiskan waktu freelance pemula jarang pekerjaan intinya — melainkan menulis penawaran, membaca brief berantakan, dan membalas email. Di situ Claude, ChatGPT, atau Gemini versi gratis menghemat berjam-jam.

## Empat pekerjaan yang aman diserahkan

- Merapikan draf penawaran yang sudah kamu tulis sendiri.
- Meringkas brief klien yang panjang jadi checklist tugas.
- Menyusun daftar pertanyaan untuk obrolan pertama.
- Menghaluskan email yang ditulis saat kamu kesal.

## Contoh prompt yang berguna

    Ini catatan mentah dari obrolan dengan calon klien:
    [tempel catatanmu]
    Ubah jadi: (1) daftar hasil yang diminta,
    (2) hal yang belum jelas dan perlu saya tanyakan,
    (3) risiko yang bisa bikin proyek molor.
    Jangan menambahkan asumsi apa pun yang tidak ada di catatan.

## Batas yang tidak boleh dilanggar

- **Jangan tempel data klien** — kontrak, daftar harga khusus, data pelanggan, apalagi yang terikat NDA.
- AI tidak tahu harga pasar Indonesia hari ini. Angka yang dia sebut adalah tebakan; pakai risetmu sendiri.
- AI tidak menanggung kesalahan. Kamu yang tanda tangan, kamu yang menanggung.
- Klien membayar penilaianmu, bukan keluaran mentah yang diteruskan tanpa dibaca.

> Aturan aman: AI boleh menyentuh KATA-KATA-mu, tidak boleh menyentuh RAHASIA klienmu.`,
      links: [
        { label: "Claude", url: "https://claude.ai" },
        { label: "ChatGPT", url: "https://chatgpt.com" },
      ],
    },
    {
      title: "Dari klien pertama ke penghasilan yang stabil",
      contentMd: `## Klien lama jauh lebih murah daripada klien baru

Mencari klien baru butuh puluhan pesan; melanjutkan dengan klien lama butuh satu. Maka pekerjaan paling menguntungkan dimulai tepat setelah proyek pertama selesai.

## Tiga hal yang diminta di hari penyerahan

1. **Testimoni**, selagi mereka masih senang. Permudah dengan tiga pertanyaan: apa masalahnya sebelum ini, apa yang paling membantu, apa hasil yang terlihat?
2. **Rekomendasi**: "Kalau ada rekan yang butuh hal serupa, boleh dikenalkan?"
3. **Langkah berikutnya**: sebut satu hal yang kamu lihat masih bisa diperbaiki, lengkap dengan harganya.

## Tawarkan paket bulanan

Pekerjaan sekali jadi bikin penghasilanmu naik-turun. Ubah jadi paket bulanan yang kecil tapi rutin — misalnya perawatan, pembaruan konten, atau rekap bulanan. Nilainya boleh lebih kecil dari proyek, tapi dia yang bikin tidurmu nyenyak.

## Naikkan harga secara bertahap

Setiap tiga klien selesai, naikkan tarif sekitar 15–20% untuk klien BARU saja. Klien lama tetap di harga lama sampai lingkupnya berubah. Kalau kalendermu penuh dua bulan ke depan, itu tanda harga sudah terlalu murah.

## Jujur soal risikonya

Penghasilan freelance tidak rata. Kumpulkan dana darurat tiga bulan biaya hidup, dan jangan berhenti dari pekerjaan tetap sebelum penghasilan sampinganmu menutupi kebutuhan tiga bulan berturut-turut.`,
    },
  ],
  quizzes: [
    {
      title: "Kuis: Freelance",
      passingScorePct: 60,
      questions: [
        { prompt: "Kenapa memilih niche?", options: ["Biar sempit", "Biar mudah dibedakan & direkomendasikan", "Biar mahal", "Karena wajib"], correctIndex: 1 },
        { prompt: "Sumber klien pertama dengan konversi tertinggi biasanya…", options: ["Iklan berbayar", "Jaringan terdekat", "Cold email massal", "SEO"], correctIndex: 1 },
        { prompt: "Tawaran yang kuat menekankan…", options: ["Fitur jasa", "Hasil untuk klien", "Harga termurah", "Portofolio panjang"], correctIndex: 1 },
      ],
    },
  ],
};
