// Seed kurikulum "Analisis Data dengan AI" — dari file CSV/spreadsheet mentah
// sampai insight & grafik siap presentasi, dipandu AI, tanpa background statistik.
// Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedAnalisisData:seedAnalisisDataContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
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
  slug: "analisis-data-dengan-ai",
  title: "Analisis Data dengan AI — dari Spreadsheet Mentah sampai Insight",
  description:
    "Untuk siapa pun yang punya data (jualan, keuangan pribadi, media sosial) dan mau membacanya dengan bantuan AI, tanpa background statistik. Dari file CSV/spreadsheet mentah sampai insight dan grafik yang bisa dipresentasikan — dipandu AI, gratis.",
  modules: [
    {
      title: "Kenalan dengan Data",
      lessons: [
        {
          title: "Data yang sudah ada di sekitarmu",
          contentMd: `## Kamu sudah punya data — cuma belum sadar

Data bukan cuma milik perusahaan besar. Kalau kamu pernah jualan online, catat pengeluaran bulanan, atau punya akun Instagram/TikTok dengan insight, kamu SUDAH punya data. Contoh yang paling sering ditemui:

- **Data jualan** — riwayat pesanan Shopee/Tokopedia, catatan kasir, mutasi transfer dari pembeli.
- **Keuangan pribadi** — mutasi rekening bank, riwayat e-wallet (GoPay/OVO/Dana), catatan pengeluaran manual.
- **Media sosial** — insight followers, likes, reach per post dari Instagram/TikTok/YouTube Studio.

## "Data terstruktur" itu apa sih

Data terstruktur = tersusun rapi dalam BARIS dan KOLOM, seperti tabel Excel: tiap baris satu catatan (misal satu transaksi), tiap kolom satu jenis info (tanggal, produk, jumlah, harga). Ini bentuk yang paling gampang diajak "ngobrol" dengan AI. Lawannya, data tidak terstruktur (foto, video, chat bebas) butuh langkah ekstra sebelum bisa dianalisis — kita fokus ke data terstruktur dulu di kelas ini.

> Latihan: buka HP atau laptopmu, cari SATU sumber data yang sudah kamu punya (histori transaksi, insight sosmed, atau catatan pengeluaran). Kamu akan pakai ini sepanjang kelas.`,
          links: [
            { label: "Satu Data Indonesia", url: "https://data.go.id" },
            { label: "Our World in Data (contoh dataset publik)", url: "https://ourworldindata.org" },
          ],
        },
        {
          title: "Data rapi vs data berantakan",
          contentMd: `## Kenapa ini penting SEBELUM tempel ke AI

AI (dan kamu) bisa salah baca kalau datanya berantakan. Kenali dulu cirinya.

## Ciri data RAPI (siap pakai)

- Satu baris pertama = header (nama kolom), tidak ada baris judul ganda di atasnya.
- Satu kolom = satu jenis info konsisten (kolom "Tanggal" isinya tanggal semua, bukan campur teks).
- Format tanggal & angka konsisten sepanjang kolom (semua **DD/MM/YYYY**, bukan campur format).
- Tidak ada sel gabungan (merged cells) dan tidak ada baris/kolom kosong di tengah tabel.

## Ciri data BERANTAKAN (perlu dirapikan dulu)

- Angka tersimpan sebagai teks (ada spasi atau simbol mata uang menempel, misal "Rp 15.000").
- Header dobel atau judul laporan ikut tercampur di baris pertama.
- Satu kolom mencampur beberapa info (misal "Nama - Kota" digabung jadi satu sel).
- Baris duplikat atau baris ringkasan (total/subtotal) menyelip di tengah data mentah.

## Cara cepat memeriksa

Scroll sekilas dari atas ke bawah — cari pola yang "aneh sendiri": sel kosong tiba-tiba, format tanggal yang beda, atau angka yang rata kiri (tanda dia tersimpan sebagai teks, bukan angka).

> Latihan: buka dataset yang kamu pilih di lesson sebelumnya. Tandai (di kepala atau catatan kecil) minimal satu hal yang perlu dirapikan sebelum dianalisis.`,
          links: [
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
          ],
        },
        {
          title: "Siapkan dataset latihan gratis",
          contentMd: `## Dua jalur: pakai data sendiri atau data publik

**Jalur 1 — data sendiri.** Ekspor jadi CSV: di Google Sheets pakai **File > Download > Comma Separated Values (.csv)**; di aplikasi kasir/marketplace biasanya ada menu **Laporan/Export**.

**Jalur 2 — dataset publik gratis** (kalau belum punya data sendiri atau mau latihan dulu):

- **data.go.id** (Satu Data Indonesia) — data pemerintah lintas sektor, gratis unduh.
- **BPS (bps.go.id)** — statistik resmi Indonesia (harga, penduduk, ekonomi).
- **Kaggle Datasets** — ribuan dataset siap pakai, banyak yang kecil & ramah pemula.
- **Google Dataset Search** — mesin pencari khusus dataset dari berbagai sumber.
- **Our World in Data** — dataset global (ekonomi, kesehatan, lingkungan) + sudah rapi.

## Kriteria dataset latihan yang baik untuk pemula

- Ukurannya kecil (ratusan–ribuan baris, bukan jutaan) — muat ditempel ke chat AI sepotong-sepotong.
- Ada kolom angka DAN kolom kategori/waktu (supaya bisa dihitung & dikelompokkan).
- Topiknya kamu pahami konteksnya — biar kamu bisa menilai masuk akal atau tidaknya hasil AI.

> Latihan: unduh atau ekspor satu dataset (maksimal beberapa ribu baris), simpan sebagai file CSV di foldermu. Ini "bahan praktik" untuk modul-modul berikutnya.`,
          links: [
            { label: "Kaggle Datasets", url: "https://www.kaggle.com/datasets" },
            { label: "Google Dataset Search", url: "https://datasetsearch.research.google.com" },
            { label: "BPS — Badan Pusat Statistik", url: "https://www.bps.go.id" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Kenalan dengan Data",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Data terstruktur dicirikan oleh…",
            options: [
              "Baris & kolom konsisten, tiap kolom satu jenis info",
              "Foto dan video acak tanpa label",
              "Tulisan bebas tanpa pola tetap",
              "Sekadar file berukuran besar",
            ],
            correctIndex: 0,
            explanation: "Struktur baris-kolom itulah yang memudahkan data dibaca AI maupun spreadsheet.",
          },
          {
            prompt: "Contoh sumber dataset publik gratis untuk latihan adalah…",
            options: [
              "Mutasi rekening bank orang lain",
              "data.go.id, Kaggle, atau BPS",
              "Password wifi tetangga",
              "Chat pribadi orang lain tanpa izin",
            ],
            correctIndex: 1,
            explanation: "data.go.id, Kaggle, dan BPS menyediakan dataset resmi/publik tanpa biaya.",
          },
          {
            prompt: "Ciri data yang BERANTAKAN adalah…",
            options: [
              "Format tanggal konsisten di semua baris",
              "Angka tersimpan sebagai teks & ada header ganda",
              "Tidak ada baris atau kolom kosong",
              "Satu kolom berisi satu jenis info",
            ],
            correctIndex: 1,
            explanation: "Angka yang tersimpan sebagai teks dan header ganda bikin AI/rumus salah baca.",
          },
          {
            prompt: "Sebelum menganalisis data, langkah paling awal yang tepat adalah…",
            options: [
              "Langsung bikin grafik dari data mentah",
              "Hapus semua data yang terlihat aneh",
              "Kenali & rapikan dulu bentuk datanya",
              "Minta AI menebak angka tanpa data asli",
            ],
            correctIndex: 2,
            explanation: "Data yang belum dikenali bentuknya berisiko menghasilkan analisis yang keliru.",
          },
        ],
      },
    },
    {
      title: "AI sebagai Analis Pribadi",
      lessons: [
        {
          title: "Tempel data ke chat AI dengan aman",
          contentMd: `## Anonimkan dulu, baru tempel

Sebelum menempel potongan data ke ChatGPT/Claude/Gemini, hilangkan atau samarkan info yang bisa mengidentifikasi orang lain:

- Ganti nama asli jadi label generik: **"Pelanggan A"**, **"Pelanggan B"**.
- Hapus/sensor nomor HP, alamat, dan nomor rekening/kartu.
- Kalau nominal sangat sensitif (misal gaji pribadi), pertimbangkan membulatkan atau memakai skala relatif ("Bulan 1 = 100%, Bulan 2 = 112%") alih-alih angka asli.

## Kenapa ini bukan basa-basi

Chat AI (versi gratis maupun berbayar) bisa menyimpan riwayat percakapan untuk peningkatan produk, tergantung kebijakan masing-masing layanan. Anggap semua yang kamu tempel berpotensi tidak sepenuhnya privat — jadi jangan pernah tempel data rahasia perusahaan/kantor tanpa izin, dan selalu anonimkan data personal.

## Cara menempel yang praktis

Untuk data tabel kecil, cukup copy-paste langsung dari spreadsheet ke chat (AI biasanya bisa membaca bentuk tabel biasa). Untuk data lebih panjang, tempel sepotong dulu (misal 20–50 baris contoh) dan jelaskan berapa total barisnya — jangan paksa menempel ribuan baris sekaligus.

> Latihan: ambil dataset latihanmu, anonimkan kolom yang sensitif (kalau ada), lalu siapkan potongan contoh (20–50 baris) yang siap ditempel ke chat AI.`,
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "ChatGPT", url: "https://chat.openai.com" },
          ],
        },
        {
          title: "Minta ringkasan & tanya-jawab data",
          contentMd: `## Pola prompt yang enak dipakai

Jangan cuma tempel data lalu diam — beri konteks dan pertanyaan spesifik:

    Ini data penjualan tokoku bulan Jan-Jun (kolom: tanggal, produk, jumlah, harga).
    Total ada 340 baris, ini contoh 30 baris pertama: (tempel data)

    Tolong:
    1. Ringkas pola umum yang kamu lihat (3-5 poin)
    2. Produk apa yang paling sering laku?
    3. Ada bulan yang menonjol (naik/turun tajam)?

## Tanya-jawab lanjutan

Setelah ringkasan pertama keluar, lanjutkan dengan pertanyaan yang lebih tajam: "kenapa menurutmu bulan Maret turun?", "bandingkan produk A vs produk B", "kalau tren ini berlanjut, perkiraan bulan depan seperti apa?". AI akan menjawab berdasarkan pola di data yang kamu berikan — bukan sihir, jadi kualitas jawabannya bergantung pada seberapa jelas data & pertanyaanmu.

## Kebiasaan yang menyelamatkan

- Minta AI **menunjukkan angka pendukung**, bukan cuma kesimpulan ("naik 20%, dari 100 ke 120 di bulan Maret").
- Kalau jawabannya terasa aneh, tanya balik: "coba tunjukkan cara hitungmu langkah demi langkah."

> Latihan: tempel potongan data latihanmu ke AI dengan pola prompt di atas, lalu ajukan 2 pertanyaan lanjutan.`,
          links: [
            { label: "Anthropic — Panduan Prompt Engineering", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
            { label: "Gemini", url: "https://gemini.google.com" },
          ],
        },
        {
          title: "Deteksi tren & anomali dasar",
          contentMd: `## Tren vs anomali

**Tren** = pola yang konsisten sepanjang waktu (penjualan naik pelan-pelan tiap bulan). **Anomali** = satu titik yang jauh menyimpang dari pola umum (tiba-tiba melonjak atau anjlok satu hari/bulan saja). Keduanya penting tapi butuh perlakuan beda: tren jadi dasar perencanaan, anomali butuh diselidiki penyebabnya sebelum dipakai kesimpulan.

## Minta AI membantu menandai

Prompt yang bisa kamu pakai:

    Dari data penjualan bulanan ini, tolong:
    1. Sebutkan tren umum (naik/turun/stabil, kira-kira berapa persen)
    2. Tandai bulan/hari yang angkanya jauh beda dari pola sekitarnya (anomali)
    3. Untuk tiap anomali, beri 1-2 kemungkinan penyebab yang masuk akal

## Selalu verifikasi manual

AI bisa menandai anomali yang sebenarnya wajar (misal lonjakan Desember karena musim liburan — bukan hal aneh). Cek konteks aslinya: apakah ada promo, hari libur, atau kesalahan input data di tanggal itu? Jangan langsung mengambil kesimpulan bisnis dari satu titik anomali tanpa cek ulang.

> Latihan: minta AI menandai satu tren dan satu anomali dari datamu, lalu cocokkan dengan yang kamu ingat sendiri — masuk akal atau tidak?`,
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "Our World in Data (contoh tren jangka panjang)", url: "https://ourworldindata.org" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: AI sebagai Analis Pribadi",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Sebelum menempel data pelanggan ke chat AI, kamu sebaiknya…",
            options: [
              "Kirim apa adanya, termasuk nama dan nomor HP",
              "Anonimkan nama, nomor HP, dan info sensitif dulu",
              "Berhenti pakai AI sama sekali",
              "Tunggu AI meminta data secara spesifik",
            ],
            correctIndex: 1,
            explanation: "Anonimkan dulu supaya info pribadi orang lain tidak ikut tersebar ke layanan AI.",
          },
          {
            prompt: "Saat minta ringkasan data ke AI, langkah paling produktif adalah…",
            options: [
              "Tempel seluruh file tanpa konteks apa pun",
              "Diam saja setelah menempel data",
              "Beri konteks (apa datanya) + pertanyaan spesifik",
              "Minta AI menebak tanpa data",
            ],
            correctIndex: 2,
            explanation: "Konteks yang jelas membantu AI memberi jawaban relevan, bukan tebakan generik.",
          },
          {
            prompt: "Anomali dalam data biasanya berarti…",
            options: [
              "Rata-rata dari seluruh dataset",
              "Nama kolom pada tabel",
              "Nilai yang jauh menyimpang dari pola umum",
              "Warna yang dipakai pada grafik",
            ],
            correctIndex: 2,
            explanation: "Anomali adalah titik yang menyimpang jauh dari pola data di sekitarnya.",
          },
          {
            prompt: "Setelah AI menandai tren/anomali, sikap yang tepat adalah…",
            options: [
              "Percaya penuh tanpa cek ulang",
              "Hapus data yang dianggap aneh oleh AI",
              "Abaikan seluruh temuan AI",
              "Verifikasi dengan melihat konteks/data aslinya",
            ],
            correctIndex: 3,
            explanation: "Temuan AI tetap perlu dicocokkan dengan konteks asli sebelum dipakai mengambil keputusan.",
          },
        ],
      },
    },
    {
      title: "Statistik Praktis Tanpa Rumus",
      lessons: [
        {
          title: "Rata-rata vs median: kapan pakai yang mana",
          contentMd: `## Dua cara menghitung "nilai tengah"

**Rata-rata (mean)** = jumlah semua angka dibagi banyaknya data. **Median** = nilai yang berada tepat di tengah kalau data diurutkan dari kecil ke besar.

## Kenapa hasilnya bisa sangat beda

Bayangkan gaji 9 karyawan biasa (sekitar Rp5 juta) plus 1 direktur (Rp95 juta). Rata-ratanya bisa "ditarik" jadi terlihat tinggi (sekitar Rp14 juta), padahal mayoritas karyawan jauh di bawah itu. Median akan lebih dekat menggambarkan "orang biasa" karena tidak mudah ditarik oleh nilai ekstrem.

## Aturan praktis

- Pakai **median** kalau data punya kemungkinan nilai ekstrem (gaji, harga rumah, lama pengerjaan proyek).
- Pakai **rata-rata** kalau data cenderung merata tanpa nilai yang jauh menonjol (misal nilai ujian di kelas kecil yang homogen).
- Kalau ragu, minta AI hitung KEDUANYA dan bandingkan — kalau selisihnya besar, itu tanda ada nilai ekstrem yang perlu kamu perhatikan.

> Latihan: minta AI menghitung rata-rata DAN median dari satu kolom angka di datamu, lalu tanya "kenapa keduanya beda/sama?"`,
          links: [
            { label: "Investopedia — Median", url: "https://www.investopedia.com/terms/m/median.asp" },
            { label: "Khan Academy — Statistics & Probability (gratis)", url: "https://www.khanacademy.org/math/statistics-probability" },
          ],
        },
        {
          title: "Persentase & pertumbuhan",
          contentMd: `## Membaca persentase dengan percaya diri

Persentase = bagian dari 100. Kalau 30 dari 200 pelanggan membeli produk baru, itu artinya 15% (30 dibagi 200, dikali 100).

## Pertumbuhan bulan-ke-bulan (MoM) dan tahun-ke-tahun (YoY)

Rumusnya dalam bahasa sehari-hari: **(angka sekarang − angka sebelumnya) dibagi angka sebelumnya, dikali 100%.**

    Penjualan Januari: 100 unit
    Penjualan Februari: 120 unit
    Pertumbuhan = (120 - 100) / 100 x 100% = 20%

**MoM** membandingkan bulan ini vs bulan lalu (peka terhadap musiman). **YoY** membandingkan bulan ini vs bulan yang sama tahun lalu (lebih adil untuk bisnis musiman, misal penjualan parsel Lebaran).

## Minta AI menghitungkan, tapi cek logikanya

Prompt: "Hitung pertumbuhan MoM untuk tiap bulan di data ini, tampilkan dalam tabel." Setelah hasil keluar, cek satu-dua angka secara kasar di kepala — kalau AI bilang tumbuh 200% padahal angkanya cuma naik sedikit, itu tanda ada yang salah hitung (bisa AI-nya, bisa juga data yang kamu kasih kurang lengkap).

> Latihan: minta AI menghitung pertumbuhan bulanan dari datamu, lalu cek manual satu bulan pakai rumus di atas.`,
          links: [
            { label: "Khan Academy — Persentase (gratis)", url: "https://www.khanacademy.org/math/statistics-probability" },
            { label: "Investopedia — Growth Rate", url: "https://www.investopedia.com" },
          ],
        },
        {
          title: "Korelasi ≠ sebab-akibat",
          contentMd: `## Jebakan klasik

Penjualan es krim dan jumlah orang tenggelam sama-sama naik di musim panas — keduanya "berkorelasi", tapi es krim jelas TIDAK menyebabkan orang tenggelam. Penyebab sebenarnya (faktor ketiga) adalah cuaca panas yang mendorong keduanya sekaligus.

## Kenapa AI bisa terjebak juga

AI cenderung pandai menemukan pola ("saat X naik, Y juga naik"), tapi menyimpulkan SEBAB-AKIBAT dari pola saja adalah lompatan yang berbahaya. Kalau AI bilang "kenaikan followers menyebabkan kenaikan penjualan", itu baru DUGAAN — bisa jadi keduanya sama-sama didorong oleh sebab lain (misal promo besar bulan itu).

## Cara menantang klaim sebab-akibat

Saat AI (atau siapa pun) mengklaim X menyebabkan Y hanya dari data yang berkorelasi, tanyakan:

- Adakah kemungkinan faktor ketiga yang menyebabkan keduanya bergerak bersamaan?
- Apakah urutan waktunya masuk akal (penyebab harus terjadi SEBELUM akibat)?
- Kalau X dihilangkan, apakah Y benar-benar berhenti terjadi?

> Latihan: cari dua kolom di datamu yang bergerak searah, minta AI menjelaskan hubungannya, lalu tantang jawabannya dengan pertanyaan di atas.`,
          links: [
            { label: "Spurious Correlations (contoh korelasi lucu tapi salah)", url: "https://www.tylervigen.com/spurious-correlations" },
            { label: "Khan Academy — Statistics & Probability (gratis)", url: "https://www.khanacademy.org/math/statistics-probability" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Statistik Praktis Tanpa Rumus",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Median lebih cocok dipakai ketika…",
            options: [
              "Data merata tanpa nilai ekstrem",
              "Ada nilai ekstrem yang bisa menarik rata-rata (mis. gaji direktur)",
              "Data hanya berisi dua angka",
              "Tidak ada data sama sekali",
            ],
            correctIndex: 1,
            explanation: "Median tidak mudah 'ditarik' oleh nilai ekstrem seperti gaji direktur yang jauh di atas rata-rata.",
          },
          {
            prompt: "Pertumbuhan bulan ke bulan (MoM) dihitung dari…",
            options: [
              "Selisih dibagi nilai bulan sebelumnya, dikali 100%",
              "Jumlah semua bulan dalam setahun",
              "Nilai tertinggi dikurangi nilai terendah sepanjang tahun",
              "Rata-rata seluruh tahun",
            ],
            correctIndex: 0,
            explanation: "Selisih dibagi nilai awal lalu dikali 100% adalah rumus pertumbuhan MoM/YoY yang standar.",
          },
          {
            prompt: "Dua hal yang berkorelasi berarti…",
            options: [
              "Yang satu pasti menyebabkan yang lain",
              "Keduanya bergerak bersamaan, belum tentu ada sebab-akibat",
              "Keduanya pasti identik nilainya",
              "Salah satunya pasti data yang salah",
            ],
            correctIndex: 1,
            explanation: "Korelasi hanya menunjukkan pola bergerak bersama, bukan bukti sebab-akibat.",
          },
          {
            prompt: "Saat AI menyimpulkan \"X menyebabkan Y\" hanya dari korelasi, sikap yang tepat adalah…",
            options: [
              "Langsung percaya dan bertindak",
              "Hapus datanya",
              "Publikasikan kesimpulan itu segera",
              "Tanya kemungkinan faktor ketiga & bukti sebab-akibat lain",
            ],
            correctIndex: 3,
            explanation: "Klaim sebab-akibat butuh bukti lebih dari sekadar dua angka yang bergerak searah.",
          },
        ],
      },
    },
    {
      title: "Visualisasi",
      lessons: [
        {
          title: "Memilih grafik yang tepat untuk ceritamu",
          contentMd: `## Grafik itu bahasa, pilih kosakata yang tepat

Grafik yang salah pilih bisa membuat data yang bagus jadi membingungkan. Panduan cepat:

- **Bar chart (batang)** — membandingkan beberapa kategori (penjualan per produk, followers per platform).
- **Line chart (garis)** — menunjukkan tren dari waktu ke waktu (penjualan per bulan selama setahun).
- **Pie chart (lingkaran)** — menunjukkan proporsi dari keseluruhan, HANYA kalau kategorinya sedikit (idealnya ≤5) — lebih dari itu jadi sulit dibaca.
- **Scatter plot (sebar titik)** — melihat hubungan antara dua angka (misal harga vs jumlah terjual).

## Kesalahan umum yang perlu dihindari

- Pakai pie chart untuk 10+ kategori (jadi potongan-potongan kecil tak terbaca).
- Pakai bar chart untuk data waktu berurutan (line chart jauh lebih jelas menunjukkan tren).
- Grafik 3D yang terlihat "keren" tapi justru menyulitkan pembaca membandingkan nilai secara akurat.

> Latihan: lihat datamu, tentukan 1 pertanyaan yang mau dijawab (misal "produk mana paling laku?"), lalu tentukan jenis grafik paling cocok untuk menjawabnya.`,
          links: [
            { label: "The Data Visualisation Catalogue (gratis)", url: "https://datavizcatalogue.com" },
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
          ],
        },
        {
          title: "Minta AI membuat & merapikan chart gratis",
          contentMd: `## Alat gratis yang cukup untuk pemula

**Google Sheets** (Insert > Chart) otomatis menyarankan jenis grafik dari data yang kamu pilih — tinggal sesuaikan. **Google Looker Studio** (gratis) cocok kalau kamu mau dashboard yang lebih rapi dan bisa dibagikan sebagai link.

## Minta bantuan AI menyusun chart-nya

Karena AI (chat biasa) tidak bisa langsung menggambar interaktif di Sheets, minta ia menuntunmu langkah demi langkah:

    Aku punya data penjualan bulanan di Google Sheets (kolom: Bulan, Total Penjualan).
    Tolong tuntun aku langkah demi langkah bikin line chart di Google Sheets,
    dengan judul, label sumbu yang jelas, dan warna yang enak dibaca.

AI juga bisa membantu memilihkan warna yang enak dipandang atau menyusun rumus bantu (misal total per kategori) sebelum grafik dibuat.

## Checklist merapikan sebelum presentasi

- Judul grafik menjelaskan ISI, bukan cuma "Chart 1" (misal "Penjualan Bulanan Jan–Jun 2026").
- Sumbu diberi label + satuan (misal "Jumlah (unit)", bukan cuma angka polos).
- Warna konsisten dan tidak lebih dari 4-5 warna berbeda dalam satu grafik.
- Hapus elemen yang tidak perlu (garis grid berlebih, legenda ganda, efek 3D).

> Latihan: buat satu grafik dari datamu di Google Sheets (atau alat gratis lain), lalu rapikan pakai checklist di atas.`,
          links: [
            { label: "Google Looker Studio (gratis)", url: "https://lookerstudio.google.com" },
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
            { label: "Claude", url: "https://claude.ai" },
          ],
        },
      ],
    },
    {
      title: "Studi Kasus End-to-End",
      lessons: [
        {
          title: "Dari data mentah ke bersih",
          contentMd: `## Praktik nyata, satu dataset, dari awal

Sekarang gabungkan semua yang sudah dipelajari: ambil SATU dataset (punyamu atau dataset publik dari Modul 1), lalu jalani alurnya dari nol.

## Langkah membersihkan

1. Buka datanya, cek header — hapus baris judul ganda atau baris ringkasan yang menyelip.
2. Perbaiki format yang tidak konsisten (tanggal, angka yang tersimpan sebagai teks).
3. Hapus baris duplikat kalau ada.
4. Anonimkan kolom sensitif SEBELUM ditempel ke AI (lihat Modul 2, Lesson 1).

## Minta AI membantu mempercepat, bukan menggantikan penilaianmu

    Aku punya data (kolom: ...). Ini contoh 20 baris pertama: (tempel)
    Tolong bantu aku:
    1. Identifikasi masalah format/konsistensi yang kamu lihat
    2. Sarankan cara membersihkannya (rumus Google Sheets kalau perlu)

Tetap kamu yang memutuskan apakah saran itu masuk akal untuk datamu — AI tidak tahu konteks bisnismu sebaik kamu.

> Latihan: bersihkan dataset pilihanmu sampai memenuhi ciri "data rapi" dari Modul 1, Lesson 2.`,
          links: [
            { label: "Kaggle Datasets", url: "https://www.kaggle.com/datasets" },
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
          ],
        },
        {
          title: "Dari bersih ke insight & slide ringkas",
          contentMd: `## Menggali insight

Dengan data yang sudah bersih, minta AI membantu menemukan 3 temuan paling penting:

    Dari data bersih ini, tolong berikan 3 insight paling penting dan menarik,
    masing-masing dengan angka pendukungnya. Jelaskan juga kenapa tiap insight
    ini relevan/penting.

## Menyusun slide ringkas (gratis)

Pakai Google Slides (gratis) dan susun sesederhana ini:

- **Slide 1** — judul & konteks singkat (dataset apa, periode apa).
- **Slide 2–4** — satu insight per slide: judul temuan + grafik pendukung + 1-2 kalimat penjelasan.
- **Slide terakhir** — ringkasan & rekomendasi/langkah selanjutnya (kalau relevan).

## Prinsip "satu slide, satu pesan"

Jangan menjejalkan semua tabel mentah ke satu slide. Pembaca harus bisa menangkap poin utama hanya dengan melihat judul + grafik, tanpa membaca paragraf panjang.

> Latihan: susun 3-4 slide ringkas dari insight yang kamu temukan, masing-masing dengan satu grafik pendukung.`,
          links: [
            { label: "Google Slides", url: "https://www.google.com/slides/about/" },
            { label: "Claude", url: "https://claude.ai" },
          ],
        },
        {
          title: "Checklist verifikasi angka (AI bisa salah hitung!)",
          contentMd: `## Kenapa langkah ini WAJIB, bukan opsional

AI bisa terdengar sangat yakin sambil salah hitung — terutama untuk operasi matematis yang melibatkan banyak angka sekaligus. Sebelum kamu mempresentasikan angka apa pun ke orang lain, cek dulu.

## Checklist sebelum presentasi

1. **Cek ulang manual** minimal 1-2 angka kunci — hitung sendiri pakai kalkulator/rumus Sheets, bandingkan dengan jawaban AI.
2. **Cek total** — apakah jumlah semua bagian benar-benar sama dengan total keseluruhan yang disebutkan?
3. **Minta AI menunjukkan cara hitungnya** langkah demi langkah, lalu telusuri satu per satu — kesalahan sering ketahuan di langkah tengah.
4. **Bandingkan dengan akal sehat** — kalau AI bilang penjualan naik 500% dalam sebulan padahal biasanya stabil, itu sinyal untuk curiga dan cek ulang datanya.
5. **Beri sumber/catatan** di slide (periode data, jumlah baris) supaya kalau ada yang bertanya, kamu bisa menelusuri kembali asalnya.

## Kalau ketemu selisih

Jangan langsung menyalahkan AI atau langsung mengubah angka sesuka hati — telusuri dulu: apakah datanya kurang lengkap, ada duplikat yang belum dibersihkan, atau memang AI salah hitung. Baru perbaiki dari akar masalahnya.

> Latihan terakhir: ambil slide yang kamu susun di lesson sebelumnya, verifikasi ulang minimal satu angka kunci di tiap slide sebelum kamu anggap "siap presentasi".`,
          links: [
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Studi Kasus End-to-End",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Langkah pertama dalam studi kasus end-to-end adalah…",
            options: [
              "Langsung bikin slide presentasi",
              "Mengirim data ke atasan tanpa diperiksa",
              "Membersihkan & memahami data mentah",
              "Menghapus data lama",
            ],
            correctIndex: 2,
            explanation: "Data yang belum bersih dan dipahami akan menghasilkan insight yang keliru di langkah berikutnya.",
          },
          {
            prompt: "Sebelum mempresentasikan angka hasil AI, kamu sebaiknya…",
            options: [
              "Cek ulang minimal 1-2 angka kunci secara manual",
              "Percaya penuh tanpa cek ulang",
              "Hapus semua catatan sumber data",
              "Ganti angkanya sesuka hati agar lebih menarik",
            ],
            correctIndex: 0,
            explanation: "AI bisa salah hitung — cek manual 1-2 angka kunci adalah pengaman termurah sebelum presentasi.",
          },
          {
            prompt: "Satu slide insight yang baik idealnya berisi…",
            options: [
              "Semua tabel data mentah",
              "Hanya judul tanpa isi",
              "Kode/rumus mentah dari spreadsheet",
              "Satu temuan jelas + grafik pendukung",
            ],
            correctIndex: 3,
            explanation: "Satu pesan jelas per slide lebih mudah dicerna audiens dibanding tabel mentah penuh angka.",
          },
          {
            prompt: "Jika total angka di grafik AI tidak cocok dengan total sumber data, kamu sebaiknya…",
            options: [
              "Abaikan saja, terlihat rapi juga cukup",
              "Selidiki selisihnya sebelum dipakai presentasi",
              "Hapus grafiknya tanpa mencari tahu sebabnya",
              "Tetap pakai apa adanya",
            ],
            correctIndex: 1,
            explanation: "Selisih total yang tidak cocok adalah tanda ada kesalahan data atau perhitungan yang perlu ditelusuri.",
          },
        ],
      },
    },
  ],
};

export const seedAnalisisDataContent = internalMutation({
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
      note: "analisis-data-dengan-ai curriculum seeded (idempotent per course slug)",
    };
  },
});
