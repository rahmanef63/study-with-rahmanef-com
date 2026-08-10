// Extra community: "Kreator Konten bareng Rahman". Courses are flat lists of
// materi (DECISIONS #37) — no module tree, one quiz per course.
//
// 2026-08-10 — depth pass. The two courses were 2 materi each of ~200 chars;
// they are now 10 each at the depth bar of aiKerjaData/analisisDataData
// (~1000 chars, practical, free tools, konteks Indonesia).
//
// APPEND-ONLY, on purpose. `upsertCurriculum` probes each materi by
// (tenantId, slug) and inserts ONLY what is missing, and a new placement is
// appended past the course's high-water mark. So: editing an existing
// lesson's contentMd here would be dead code (the live row never changes),
// and inserting a materi mid-array would still land it at the END of the
// already-seeded course. The four original materi are therefore untouched,
// title and body, and everything new is appended in reading order.
import type { SeedCommunity } from "./types";

export const COMMUNITY_KREATOR_KONTEN: SeedCommunity = {
  slug: "kreator-konten",
  name: "Kreator Konten AI",
  description:
    "Bikin konten konsisten pakai bantuan AI — ide, skrip, dan caption tanpa buntu.",
  track: "konten",
  courses: [
    {
      slug: "ide-konten",
      title: "Ide Konten Tanpa Buntu",
      description: "Sistem sederhana biar nggak pernah kehabisan ide.",
      lessons: [
        {
          title: "Pancing ide dengan AI",
          contentMd: `## AI = partner brainstorming

Jangan cuma minta "kasih ide konten". Beri konteks: audiens, niche, tujuan.

Contoh prompt: *"10 ide Reels untuk pemula belajar AI, format tips singkat, gaya santai."*

AI memancing, **kamu yang menyaring** sesuai selera.`,
        },
        {
          title: "Kalender konten 30 hari",
          contentMd: `## Batch, jangan harian

Sisihkan 1 hari untuk merencanakan 30 hari. Pilih 3–4 **pilar konten** lalu rotasi:

- Edukasi · Cerita · Promosi · Interaksi

Konsistensi mengalahkan viral sesekali.`,
        },
        {
          title: "Kenali audiensmu dulu, baru cari ide",
          contentMd: `## Ide bagus untuk orang yang salah tetap sepi

Kebanyakan akun buntu bukan karena kehabisan ide, tapi karena idenya ditujukan untuk "semua orang" — dan konten untuk semua orang biasanya tidak menyentuh siapa-siapa. Sebelum brainstorming, tulis dulu SATU paragraf tentang orang yang kamu ajak bicara.

## Tiga hal yang harus bisa kamu jawab

1. **Siapa dia** — umur, kerjaan, kota, alat yang dia punya (HP saja? laptop kantor?).
2. **Apa yang bikin dia pusing minggu ini** — bukan masalah seumur hidup, masalah minggu ini.
3. **Apa yang sudah dia coba dan gagal** — di situ letak konten yang bikin dia merasa "kok tahu banget".

Contoh: *"Ibu 30-an di Bekasi, jualan kue lewat WhatsApp, pakai HP, bingung kenapa foto kuenya kelihatan murah, sudah coba filter tapi malah aneh."*

## Bekali AI dengan paragraf itu

    Ini profil audiensku: [tempel paragraf di atas]
    Beri 10 pertanyaan yang kemungkinan besar dia ketik di kolom
    pencarian, urutkan dari yang paling sering ditanya pemula.
    Jangan pakai istilah teknis.

Simpan paragraf itu di catatan HP. Setiap permintaan ide berikutnya dimulai dengan menempelnya — hasilnya langsung berbeda jauh dari sekadar "kasih ide konten dong".`,
          links: [
            { label: "Claude", url: "https://claude.ai" },
            { label: "ChatGPT", url: "https://chatgpt.com" },
          ],
        },
        {
          title: "Riset topik gratis: Google Trends, kolom komentar, grup WhatsApp",
          contentMd: `## AI tidak tahu apa yang sedang ramai di kotamu

Model AI belajar dari data lama dan tidak melihat notifikasi HP-mu. Untuk ide yang segar, KAMU yang mengumpulkan bahan mentah; AI yang merapikan.

## Tiga sumber gratis yang selalu tersedia

| Sumber | Cara pakai | Yang kamu dapat |
|---|---|---|
| Google Trends | Bandingkan 2–3 kata kunci, filter Indonesia, 12 bulan terakhir | Musim naik-turun sebuah topik |
| Kolom komentar | Baca 30 komentar teratas di 3 akun sejenis | Bahasa asli audiensmu |
| Grup WhatsApp / Facebook | Catat pertanyaan yang berulang tiap minggu | Masalah yang belum terjawab |

## Ubah bahan mentah jadi ide

Salin 20–30 komentar (hapus nama orangnya), lalu:

    Ini komentar dari audiens sejenis. Kelompokkan jadi tema,
    urutkan dari yang paling sering muncul, lalu tulis 1 ide konten
    untuk tiap tema pakai bahasa yang mereka pakai sendiri.

## Satu hal yang sering disalahpahami

Google Trends menunjukkan MINAT relatif, bukan jumlah orang. Garis yang naik tajam bisa berarti satu berita viral yang besok hilang. Pakai untuk memilih waktu tayang dan sudut pembahasan — bukan untuk memutuskan seluruh niche-mu.`,
          links: [
            { label: "Google Trends", url: "https://trends.google.com/trends/" },
          ],
        },
        {
          title: "Empat pilar konten yang bisa kamu isi setahun",
          contentMd: `## Pilar itu laci, bukan tema sekali pakai

Materi kedua menyebut pilar konten. Sekarang kita bikin punyamu sendiri. Pilar yang baik itu seperti laci: setiap ide baru langsung tahu masuk laci mana, dan setiap laci bisa diisi puluhan kali tanpa terasa mengulang.

## Ramuan empat laci

| Pilar | Tugasnya | Contoh (akun jualan kue) |
|---|---|---|
| Edukasi | Bikin orang lebih paham | "Kenapa buttercream-mu meleleh" |
| Cerita | Bikin orang percaya | "Orderan pertama yang gagal total" |
| Bukti | Bikin orang yakin beli | Proses packing, testimoni asli |
| Interaksi | Bikin orang bersuara | "Pilih: cokelat atau pandan?" |

Rotasi empat laci itu tiap minggu: 4 pilar × 4 minggu = 16 konten sebulan tanpa mikir dari nol.

## Minta AI mengisi satu laci saja

    Pilar kontenku: Edukasi, Cerita, Bukti, Interaksi.
    Audiens: [tempel profil audiens].
    Beri 5 ide untuk pilar "Edukasi" SAJA, masing-masing 1 kalimat,
    jangan ada yang mirip satu sama lain.

Satu pilar per prompt. Kalau diminta keempatnya sekaligus, hasilnya cenderung dangkal dan saling menyerempet.

## Kapan pilar perlu diganti

Ganti kalau satu laci selalu kosong tiga minggu berturut-turut. Itu tandanya laci tersebut memang bukan kamu — bukan tandanya kamu malas.`,
        },
        {
          title: "Bank ide di Google Sheets yang tidak pernah kosong",
          contentMd: `## Ide hilang karena tidak punya rumah

Ide paling bagus biasanya datang saat kamu sedang tidak siap: di motor, di antrean, jam sebelas malam. Kalau tidak ada tempat menaruhnya, besok pagi sudah lupa. Satu spreadsheet gratis menyelesaikan ini.

## Lima kolom, tidak perlu lebih

| Kolom | Isi |
|---|---|
| Ide | Satu kalimat, bahasa bebas |
| Pilar | Edukasi / Cerita / Bukti / Interaksi |
| Sumber | Komentar siapa, grup mana, tren apa |
| Status | Mentah / Siap syuting / Tayang |
| Tanggal | Diisi belakangan |

Buat di Google Sheets, lalu pasang pintasannya di layar utama HP. Aturan satu-satunya: ide masuk dalam 30 detik, tanpa dinilai bagus atau jelek dulu.

## Sekali seminggu, minta AI menyortir

    Ini daftar ide mentahku (kolom Ide dan Pilar).
    Tandai mana yang saling tumpang tindih, gabungkan yang mirip,
    lalu urutkan 10 teratas berdasarkan seberapa cepat bisa dibuat
    dengan HP saja. Beri alasan singkat tiap urutan.

## Jujur soal jebakannya

Spreadsheet gampang berubah jadi hobi baru: rapi, berwarna, penuh — tapi tidak ada yang tayang. Kalau kolom Status "Tayang" kosong dua minggu berturut-turut, tutup spreadsheet-nya dan bikin satu konten hari itu juga.`,
          links: [
            { label: "Google Sheets", url: "https://www.google.com/sheets/about/" },
          ],
        },
        {
          title: "Satu ide jadi lima konten: seni daur ulang",
          contentMd: `## Satu ide, lima pintu masuk

Ide yang bagus jarang habis dalam satu unggahan. Orang yang tidak sempat menonton videomu mungkin membaca carousel-nya; yang jarang buka Instagram mungkin melihatnya di status WhatsApp.

## Peta daur ulang satu ide

| Format | Ukuran | Yang dipakai ulang |
|---|---|---|
| Reels / Shorts | 30 detik | Satu poin paling tajam |
| Carousel | 5–7 slide | Semua poin, dipecah |
| Caption panjang | ±150 kata | Ceritanya, bukan tipsnya |
| Status WhatsApp | 1 gambar | Satu kalimat + ajakan DM |
| Balasan komentar | 2 kalimat | Bagian yang paling ditanya |

## Prompt yang bekerja

    Ini skrip Reels-ku: [tempel].
    Ubah jadi carousel 6 slide. Slide 1 hook, slide 2-5 satu poin
    per slide maksimal 20 kata, slide 6 ajakan. JANGAN tambah
    informasi baru yang tidak ada di skrip.

Kalimat terakhir itu penting. Tanpa itu, AI sering menambah klaim yang tidak pernah kamu ucapkan — dan kamu yang menanggungnya di kolom komentar.

## Beri jeda, jangan borong sehari

Sebar lima format itu ke 7–10 hari. Audiens yang sama melihat semuanya dalam sehari akan merasa kamu mengulang-ulang; dalam seminggu, mereka merasa kamu konsisten.`,
        },
        {
          title: "Batch produksi: satu sore untuk dua minggu konten",
          contentMd: `## Musuh konsistensi adalah pemanasan

Setiap kali mulai bikin konten kamu membayar ongkos pemanasan: ganti baju, atur cahaya, ingat-ingat mau ngomong apa. Bayar sekali untuk sepuluh konten, bukan sepuluh kali untuk satu konten.

## Satu sore, empat blok

1. **Blok tulis (45 menit)** — ambil 6 ide teratas dari bank ide, minta AI merapikannya jadi 6 skrip pendek, lalu kamu sunting supaya terdengar seperti kamu.
2. **Blok siap (20 menit)** — salin skrip ke Notes HP, ganti baju sekali saja, cari jendela dengan cahaya alami.
3. **Blok rekam (60 menit)** — rekam semua berurutan tanpa mengedit. Salah? ulangi kalimatnya, jalan terus.
4. **Blok edit (60 menit)** — potong di CapCut atau editor bawaan HP, teks di layar seadanya, ekspor semuanya.

## Cahaya dan suara lebih penting daripada kamera

HP mana pun sudah cukup. Hadap jendela, jangan membelakanginya. Rekam di ruangan berkarpet atau yang banyak kainnya supaya suara tidak menggema — ini perbaikan gratis yang paling terasa hasilnya.

## Kalau sore itu berantakan

Turunkan target, jangan batalkan. Dua konten yang jadi jauh lebih berguna daripada enam yang cuma ada di kepala.`,
          links: [
            { label: "CapCut (gratis)", url: "https://www.capcut.com" },
          ],
        },
        {
          title: "Jadwal tayang gratis dengan Meta Business Suite",
          contentMd: `## Menjadwalkan itu menghapus alasan

Konten yang sudah diekspor tapi belum diunggah sama saja dengan konten yang tidak ada. Meta Business Suite gratis dan bisa menjadwalkan Instagram plus Facebook sekaligus dari laptop; TikTok dan YouTube punya penjadwal bawaan di versi web-nya.

## Rutinitas 20 menit sekali seminggu

1. Buka menu Planner di Meta Business Suite, pilih tanggalnya.
2. Unggah video hasil batch, tempel caption dari bank ide.
3. Isi jadwal 7 hari ke depan sekali jalan.
4. Sisakan satu slot kosong per minggu untuk konten dadakan atau momen.

## Jam tayang: berhenti menebak

Tidak ada jam ajaib yang berlaku untuk semua akun. Buka Insights akunmu sendiri, lihat kapan pengikutmu paling aktif, lalu uji dua jam berbeda selama dua minggu. Data akunmu sendiri mengalahkan daftar "jam terbaik posting" mana pun di internet.

## Yang tidak boleh dijadwalkan

Balasan komentar. Jadwalkan unggahannya, tapi hadirlah sendiri 30 menit setelah tayang untuk membalas. Percakapan adalah bagian yang paling tidak bisa didelegasikan ke AI tanpa langsung terasa palsu.`,
          links: [
            { label: "Meta Business Suite", url: "https://business.facebook.com" },
          ],
        },
        {
          title: "Baca angka tanpa pusing: ide mana yang layak diulang",
          contentMd: `## Tiga angka saja, sisanya abaikan dulu

Dasbor analitik penuh angka yang tidak akan mengubah keputusanmu. Untuk memilih ide mana yang layak diulang, cukup tiga:

| Angka | Artinya | Kalau rendah |
|---|---|---|
| Penonton yang lewat detik ke-3 | Hook-mu bekerja atau tidak | Ganti kalimat pembuka |
| Rata-rata durasi tonton | Isinya menahan atau tidak | Potong bagian tengah |
| Simpanan + kiriman ke teman | Kontennya berguna atau tidak | Idenya belum menyelesaikan masalah |

Like dan jumlah pengikut memang menyenangkan, tapi paling lambat memberi tahu apa yang harus kamu ubah.

## Rutinitas bulanan 15 menit

Kumpulkan 10 konten terakhir dalam satu tabel sederhana (judul, pilar, tiga angka di atas), lalu:

    Ini 10 kontenku bulan ini beserta angkanya.
    Cari pola: pilar mana yang paling kuat, panjang berapa detik
    yang paling ditonton habis, jenis hook apa yang menang.
    Katakan terus terang kalau datanya terlalu sedikit untuk disimpulkan.

## Kalimat terakhir itu wajib

AI akan dengan senang hati menyimpulkan "tren" dari 10 baris data, padahal 10 konten belum cukup untuk apa pun. Sebuah pola baru layak dipercaya kalau berulang di tiga bulan yang berbeda.`,
        },
      ],
      quizzes: [
        {
          title: "Kuis: Ide Konten",
          passingScorePct: 60,
          questions: [
            { prompt: "Prompt ide yang baik memberi AI…", options: ["Satu kata", "Konteks: audiens/niche/tujuan", "Hanya emoji", "Tanpa arahan"], correctIndex: 1 },
            { prompt: "Cara menjaga konsistensi konten?", options: ["Bikin harian dadakan", "Batch & pakai pilar konten", "Tunggu mood", "Hanya pas viral"], correctIndex: 1 },
          ],
        },
      ],
    },
    {
      slug: "skrip-caption",
      title: "Skrip & Caption Cepat",
      description: "Nulis hook & caption yang ngajak aksi, cepat.",
      lessons: [
        {
          title: "Rumus hook 3 detik",
          contentMd: `## 3 detik pertama menentukan

Hook = **janji + rasa penasaran.**

Pola: *"Berhenti lakukan X"*, *"3 kesalahan Y"*, *"Cara Z tanpa W"*.

Uji beberapa hook, pertahankan yang paling menahan tontonan.`,
        },
        {
          title: "Caption yang ngajak aksi",
          contentMd: `## Struktur caption

1. **Hook** (baris pertama).
2. **Nilai** (1–3 poin).
3. **CTA** (komentar / simpan / bagikan).

Cukup **satu ajakan** per caption.`,
        },
        {
          title: "Brief singkat: bekali AI sebelum minta skrip",
          contentMd: `## AI tidak kenal kamu, kecuali kamu kenalkan

Skrip buatan AI terdengar kaku karena promptnya kosong konteks. Yang bekerja: buat satu "brief" sekali saja, simpan di catatan, lalu tempel di awal setiap permintaan skrip.

## Isi brief yang cukup (satu layar HP)

- **Siapa aku** — nama akun, apa yang kujual atau kuajarkan, kota.
- **Audiens** — satu paragraf profil dari kelas Ide Konten.
- **Nada** — santai, pakai "kamu", boleh bercanda, hindari istilah Inggris kecuali sudah umum.
- **Pantangan** — tanpa emoji bertebaran, tanpa "di era digital ini", tanpa janji hasil instan.
- **Format standar** — hook 1 kalimat, isi 3 poin, penutup 1 ajakan.

## Cara memakainya

    [tempel brief di sini]
    Dengan brief di atas, tulis skrip Reels 30 detik tentang
    [topik]. Tulis seperti orang bicara, bukan seperti artikel.
    Kalimat maksimal 12 kata.

## Perbaiki briefnya, bukan promptnya

Kalau hasil terasa meleset, jangan menambal dengan instruksi baru setiap kali. Perbaiki briefnya — satu perbaikan di sana memperbaiki semua skrip berikutnya. Bagian **Pantangan** biasanya yang paling sering perlu tambahan, karena setiap orang punya kalimat klise yang bikin dirinya sendiri risih.`,
        },
        {
          title: "Skrip Reels 30 detik: struktur per detik",
          contentMd: `## 30 detik itu empat bagian, bukan satu tarikan napas

| Detik | Bagian | Tugasnya |
|---|---|---|
| 0–3 | Hook | Bikin jempol berhenti |
| 3–8 | Janji | Sebut apa yang akan dia dapat |
| 8–25 | Isi | 2–3 poin, satu kalimat masing-masing |
| 25–30 | Penutup | Satu ajakan, satu saja |

Tiga puluh detik bicara santai kira-kira 75–85 kata. Kalau skrip dari AI panjangnya 150 kata, itu dua konten, bukan satu.

## Contoh utuh (akun jualan kue rumahan)

    Hook: Buttercream-mu meleleh bukan karena kepanasan.
    Janji: Tiga menit ini bikin kuemu tahan di jalan.
    Isi 1: Mentega dan margarin bukan barang yang sama.
    Isi 2: Kocok sampai pucat, bukan sampai lembut.
    Isi 3: Dinginkan mangkuknya sebelum mulai.
    Penutup: Komentar "TAHAN" kalau mau daftar bahannya.

## Sunting dengan telingamu, bukan matamu

Baca skripnya keras-keras sebelum merekam. Kalimat yang bikin lidahmu tersandung pasti bikin penonton tersandung juga — potong atau pecah jadi dua. Langkah ini paling sering dilewati dan paling besar bedanya.`,
        },
        {
          title: "Skrip video panjang: outline dulu, kalimat belakangan",
          contentMd: `## Jangan minta AI menulis 8 menit sekaligus

Meminta skrip panjang dalam sekali jalan menghasilkan teks yang rata: semua bagian terasa sama pentingnya, tidak ada yang menonjol. Kerjakan dua tahap.

## Tahap 1 — outline yang kamu setujui dulu

    Buat outline video 8 menit tentang [topik] untuk [audiens].
    Bentuknya: 1 hook, 4 bagian, 1 penutup. Tulis judul tiap bagian
    plus satu kalimat isinya. Jangan tulis skripnya dulu.

Baca outline itu pelan-pelan. Buang bagian yang kamu sendiri tidak yakin. Tambahkan bagian yang cuma kamu yang bisa menceritakannya — pengalaman, kegagalan, angka dari usahamu sendiri. Di situlah videomu berbeda dari video AI mana pun.

## Tahap 2 — isi satu bagian per prompt

*"Tulis bagian 2 saja, 150 kata, gaya bicara, dengan satu contoh nyata."* Menyambung potongan-potongan itu jadi utuh adalah pekerjaan sepuluh menit, dan hasilnya jauh lebih hidup daripada satu blok teks panjang.

## Tandai titik lelah penonton

Sisipkan pergantian setiap 60–90 detik: ganti sudut kamera, tampilkan layar, atau lempar pertanyaan. Tandai titik-titik itu di outline sebelum merekam, supaya kamu tidak baru sadar saat sudah masuk meja edit.`,
        },
        {
          title: "Latih AI meniru gaya bicaramu",
          contentMd: `## Gaya sulit dijelaskan, tapi gampang dicontohkan

"Tulis dengan gaya santai" terlalu kabur — hasilnya gaya santai versi rata-rata internet. Yang bekerja: berikan contoh tulisan atau ucapanmu sendiri, lalu minta AI menirunya.

## Cara mengambil contoh, gratis

1. Pilih 3 kontenmu yang paling terasa "kamu banget".
2. Ambil transkripnya: unggah sebagai video privat di YouTube lalu salin teks otomatisnya, atau ketik ulang pakai voice typing di Google Docs.
3. Tempel ketiganya sebagai contoh.

    Ini tiga transkrip caraku bicara. Pelajari polanya: panjang
    kalimat, kata yang sering kupakai, cara membuka dan menutup.
    Tulis daftar 8 ciri gayaku, lalu pakai daftar itu untuk
    menulis skrip baru tentang [topik].

Simpan daftar 8 ciri itu dan tempel bersama briefmu di kemudian hari — jauh lebih hemat daripada mengirim transkrip berulang-ulang.

## Batasnya, jujur saja

Tiruan gaya bagus untuk kerangka dan draf pertama. Cerita pribadi, angka dari usahamu, dan pendapat yang berisiko tetap harus keluar dari kepalamu. Penonton cepat mencium tulisan yang rapi tapi tidak mempertaruhkan apa-apa.`,
          links: [
            { label: "Google Docs (voice typing)", url: "https://docs.google.com" },
          ],
        },
        {
          title: "Judul & thumbnail: tiga kata yang kebaca di layar kecil",
          contentMd: `## Thumbnail dilihat sebesar perangko

Sebagian besar penonton melihat thumbnail-mu selebar ibu jari, sambil jalan, dengan layar yang silau. Semua keputusan desain mengikuti satu kenyataan itu.

## Aturan yang jarang meleset

- **Maksimal 3–4 kata**, huruf tebal, tinggi teksnya minimal seperempat gambar.
- **Kontras keras** — teks terang di latar gelap atau sebaliknya. Warna cantik yang senada berarti tidak terbaca.
- **Satu fokus** — satu wajah, atau satu objek, atau satu angka. Bukan ketiganya sekaligus.
- **Jangan mengulang judul** — thumbnail melengkapi judul, tidak menyalinnya.

## Alat gratis

Canva punya template ukuran siap pakai; Photopea jalan langsung di browser tanpa memasang apa pun. Font gratis dari Google Fonts — pilih satu yang tebal, lalu berhenti mencari.

## AI untuk judulnya, bukan untuk wajahnya

    Beri 10 judul untuk video tentang [topik], maksimal 45 karakter,
    tanpa huruf kapital semua, tanpa tanda seru. Lima berupa
    pertanyaan, lima berupa pernyataan.

Uji dengan tes perangko: kecilkan thumbnail sampai selebar ibu jari di layar HP-mu sendiri. Kalau kamu tidak bisa membacanya dalam sekejap, perbesar hurufnya dan kurangi katanya.`,
          links: [
            { label: "Canva (gratis)", url: "https://www.canva.com" },
            { label: "Photopea (gratis, di browser)", url: "https://www.photopea.com" },
            { label: "Google Fonts", url: "https://fonts.google.com" },
          ],
        },
        {
          title: "Sunting kejam: potong 30% tanpa kehilangan isi",
          contentMd: `## Draf pertama selalu sekitar 30% terlalu panjang

Baik draf dari AI maupun draf tulisanmu sendiri. Memotong bukan berarti membuang isi — memotong justru membuat isinya kelihatan.

## Empat gunting, urut dari atas

1. **Pemanasan** — buang kalimat pertama kalau isinya "di video kali ini aku mau bahas". Mulai dari kalimat kedua.
2. **Pengulangan** — kalau satu poin dijelaskan dua kali dengan kata berbeda, sisakan yang paling konkret.
3. **Kata pengisi** — "sebenarnya", "jadi gini", "nah", "yang mana itu". Sisakan seperlunya supaya tetap terdengar manusia, bukan dihapus habis.
4. **Penutup ganda** — satu ajakan saja. Kalau ada dua, penonton memilih untuk tidak melakukan keduanya.

## Minta AI jadi editor, bukan penulis

    Potong teks ini jadi 70% panjang aslinya. Jangan tambah kata
    atau ide baru, jangan ganti istilah yang sudah kupakai.
    Tandai bagian yang kamu potong beserta alasan singkatnya.

Minta penandanya. Kadang yang dibuang justru kalimat favoritmu yang memang perlu tetap ada, dan dengan penanda kamu bisa mengembalikannya tanpa mengulang dari nol.

## Uji akhir

Baca versi pendeknya keras-keras sambil menghitung waktu. Kalau isinya tetap utuh dan durasinya turun, potonganmu benar.`,
        },
        {
          title: "Terus terang soal AI: label, etika, dan yang tak boleh diserahkan",
          contentMd: `## Dibantu AI bukan aib; menyembunyikannya iya

Menulis draf dengan AI itu seperti memakai kalkulator — alat. Yang jadi masalah bukan alatnya, tapi kalau penonton dibiarkan mengira sesuatu yang tidak benar.

## Tiga tingkat, tiga sikap

| Yang kamu lakukan | Perlu diberi tahu? |
|---|---|
| AI bantu ide, kerangka, atau menyunting tulisanmu | Tidak wajib — itu tetap suaramu |
| Suara, wajah, atau video dibuat/diubah AI | **Wajib** — pasang label |
| Testimoni, foto sebelum-sesudah, atau angka hasil yang tidak nyata | Jangan dibuat sama sekali |

TikTok dan YouTube menyediakan penanda konten AI di menu unggah, dan Meta memasang label sendiri pada konten yang terdeteksi dibuat AI. Centang sejak awal: ketahuan belakangan jauh lebih mahal daripada jujur di depan.

## Empat hal yang jangan diserahkan ke AI

- Klaim kesehatan, hukum, atau keuangan tanpa kamu cek ke sumber resmi.
- Angka, tanggal, dan nama orang — AI mengarang dengan sangat percaya diri.
- Wajah atau suara orang lain, termasuk figur publik, tanpa izin.
- Permintaan maaf. Kalau kamu salah, tulis sendiri.

## Satu baris sudah cukup

*"Naskah video ini dibuat dengan bantuan AI."* Penonton yang peduli akan menghargai keterusteranganmu, dan yang tidak peduli tetap menonton.`,
          links: [
            { label: "Bantuan YouTube (cari: konten sintetis)", url: "https://support.google.com/youtube" },
          ],
        },
        {
          title: "Uji hook tanpa alat berbayar",
          contentMd: `## Kamu tidak bisa menebak hook mana yang menang

Kreator berpengalaman pun sering salah tebak. Yang membedakan mereka: hook diuji, bukan diperdebatkan.

## Uji termurah: dua unggahan, satu selisih

1. Buat dua versi konten yang SAMA persis, hanya hook 3 detiknya yang berbeda.
2. Tayangkan berjarak 3–4 hari, jam yang mirip, hari kerja dibanding hari kerja.
3. Bandingkan satu angka saja: berapa persen penonton bertahan lewat detik ke-3.

Selisih tipis (di bawah 10%) artinya seri — jangan ambil kesimpulan. Selisih jauh yang berulang di dua uji berikutnya, baru itu pola.

## Ujian gratis sebelum tayang

Kirim 3 pilihan hook ke grup WhatsApp teman atau Close Friends: *"kalau lihat ini di beranda, yang mana bikin kamu berhenti?"* Lima jawaban jujur dalam sepuluh menit lebih berguna daripada satu jam berdebat sendiri di kepala.

## Simpan yang menang

Tambahkan kolom "Hook menang" di bank idemu. Setelah sepuluh uji, kamu punya daftar pola milikmu sendiri — bukan daftar rumus dari internet yang belum tentu cocok untuk audiensmu.

## Yang tidak perlu diuji

Warna teks, satu emoji, tanda seru. Uji hal yang bisa mengubah hasil dua kali lipat: kalimat pembuka, gambar tiga detik pertama, dan janji yang kamu berikan.`,
        },
      ],
      quizzes: [
        {
          title: "Kuis: Skrip & Caption",
          passingScorePct: 60,
          questions: [
            { prompt: "Hook yang kuat berisi…", options: ["Salam panjang", "Janji + rasa penasaran", "Deretan hashtag", "Tag teman"], correctIndex: 1 },
            { prompt: "Caption sebaiknya punya berapa CTA utama?", options: ["Sebanyak mungkin", "Satu", "Nol", "Lima"], correctIndex: 1 },
          ],
        },
      ],
    },
  ],
  welcome: {
    title: "Selamat datang di Kreator Konten AI! 🎬",
    bodyMd: `Buat kamu yang bikin konten: **ide, skrip, caption** jadi lebih cepat dengan AI.

- **Ide Konten Tanpa Buntu** — sistem ide 30 hari.
- **Skrip & Caption Cepat** — hook & CTA yang bekerja.

Selamat berkarya!`,
  },
  sumber: [
    { title: "Bank hook siap pakai", url: "https://claude.ai", note: "Minta variasi hook ke Claude pakai konteksmu." },
  ],
};
