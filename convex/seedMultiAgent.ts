// Seed kurikulum "Orkestrasi Multi-Agent untuk Proyek Nyata" — kelanjutan
// "Bikin Aplikasi Web dengan AI": cara menjalankan beberapa agent AI sekaligus
// untuk satu proyek, seperti punya tim developer. Studi kasus modul 5 memakai
// platform belajar ini sendiri sebagai contoh nyata (tanpa detail rahasia/infra).
// Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedMultiAgent:seedMultiAgentContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
//
// Idempoten per course: slug yang sudah ada dilewati utuh. Catatan konten:
// code sample memakai INDENTED code block (4 spasi, CommonMark) agar bebas
// backtick di template literal.
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
  slug: "orkestrasi-multi-agent",
  title: "Orkestrasi Multi-Agent untuk Proyek Nyata",
  description:
    "Kelanjutan 'Bikin Aplikasi Web dengan AI': cara menjalankan beberapa agent AI sekaligus untuk satu proyek, seperti punya tim developer. Dari satu agent jadi tim agent — kontrak kerja, pembagian tugas paralel, review, dan integrasi — dipraktikkan lewat studi kasus nyata: platform belajar yang sedang kamu pakai ini sendiri dibangun dengan pola yang sama.",
  modules: [
    {
      title: "Kenapa Multi-Agent",
      lessons: [
        {
          title: "Batas Satu Sesi: Context Window & Fokus",
          contentMd: `## Kenapa satu sesi ada batasnya

Setiap kali kamu chat dengan AI, ada satu ruang percakapan yang disebut **context window** — semua teks yang bisa "dilihat" model dalam satu momen: instruksi sistem, seluruh pesan sebelumnya, isi file yang kamu tempel, dan balasan yang sedang ditulis. Semuanya ikut menghitung.

Bayangkan context window seperti meja kerja. Semakin banyak kertas kamu tumpuk di atasnya, semakin sulit model menemukan yang penting — walau mejanya besar. Fenomena ini dikenal sebagai **context rot**: makin panjang percakapan, makin gampang instruksi awal "terlupa" atau tercampur detail yang tidak relevan.

## Dua batas yang sering diabaikan

1. **Batas ukuran** — context window sebesar apa pun tetap terbatas; menempel seluruh proyek besar dalam satu sesi biasanya kontraproduktif.
2. **Batas fokus** — bahkan sebelum ukurannya penuh, satu sesi yang mengerjakan terlalu banyak hal berbeda cenderung kehilangan presisi dibanding sesi yang fokus pada satu wilayah kerja.

> Uji cepat: kalau KAMU sendiri kesulitan menjelaskan dalam dua kalimat "sesi ini sedang mengerjakan apa", context-nya kemungkinan sudah kepenuhan.

Modul-modul berikutnya membahas solusinya: memecah pekerjaan besar menjadi beberapa sesi/agent yang masing-masing punya wilayah dan fokus sendiri — dikoordinasi lewat dokumen dan papan status, bukan diingat di kepala satu orang.`,
          links: [
            { label: "Context windows — dokumentasi Claude", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows" },
            { label: "Effective context engineering for AI agents — Anthropic", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
          ],
        },
        {
          title: "Kapan Satu Agent Sudah Cukup, Kapan Butuh Tim",
          contentMd: `## Tidak semua pekerjaan butuh tim

Sebelum buru-buru membentuk "tim agent", tanyakan dulu: apakah pekerjaan ini benar-benar butuh lebih dari satu? Multi-agent menambah biaya koordinasi (kontrak, papan klaim, review) — kalau tugasnya kecil, biaya itu tidak sepadan.

## Sinyal satu agent SUDAH CUKUP

- Tugas menyentuh satu wilayah file/folder yang jelas.
- Perkiraan selesai dalam satu sesi kerja yang wajar.
- Kamu (atau agent-nya) bisa mengawasi seluruh perubahan sekaligus.

## Sinyal kamu BUTUH lebih dari satu agent

- Pekerjaan terbagi ke beberapa area yang TIDAK saling bergantung ketat (mis. beberapa fitur berbeda, masing-masing di folder sendiri).
- Total pekerjaan jelas melebihi satu context window yang sehat bila dikerjakan berurutan dalam satu sesi.
- Ada tenggat yang membuat paralelisasi bernilai lebih dari biaya koordinasinya.

> Analogi dapur: satu koki cukup untuk masakan rumahan. Restoran sibuk butuh brigade — tapi brigade yang berantakan tanpa pembagian tugas justru lebih lambat dari satu koki yang tenang.

Latihan gratis: ambil satu tugas nyata yang sedang kamu kerjakan dengan AI. Coba jawab jujur — ini kasus "satu agent cukup" atau "butuh dipecah"? Modul 2 mengajarkan cara memecahnya dengan aman.`,
          links: [
            { label: "Create custom subagents — Claude Code Docs", url: "https://code.claude.com/docs/en/sub-agents" },
            { label: "Subagents in the SDK — Claude API Docs", url: "https://platform.claude.com/docs/en/agent-sdk/subagents" },
          ],
        },
        {
          title: "Dua Peran Inti: Integrator vs Worker",
          contentMd: `## Manajer dan tukang — dua topi yang berbeda

Begitu kamu memutuskan butuh lebih dari satu agent, langkah berikutnya adalah membagi PERAN, bukan sekadar membagi tugas.

- **Worker** — mengerjakan SATU potongan pekerjaan di wilayahnya sendiri, melapor saat selesai, tidak menyentuh area lain.
- **Integrator** — memegang gambaran besar: menjaga dokumen aturan, papan status, mereview laporan tiap worker, memutuskan apa yang digabung, dan bertanggung jawab atas hasil akhir.

Satu orang (kamu) bisa memainkan kedua peran secara bergantian — tapi jangan mencampur keduanya DALAM satu sesi yang sama. Sesi worker fokus mengerjakan; sesi integrator fokus menilai dan menggabungkan.

## Kenapa pemisahan ini penting

1. **Akuntabilitas jelas** — kalau ada yang salah, gampang dilacak: punya worker mana, dan siapa yang mereview.
2. **Fokus terjaga** — worker tidak perlu memikirkan keseluruhan proyek; integrator tidak perlu menulis kode baris demi baris.
3. **Skalabel** — menambah satu worker baru tidak mengubah cara kerja integrator.

> Kesalahan pemula paling umum: integrator ikut menulis kode di wilayah worker "karena lebih cepat". Ini menghapus jejak akuntabilitas dan sering memicu tabrakan edit. Modul 2 menunjukkan cara menghindarinya lewat aturan tertulis.`,
          links: [
            { label: "AGENTS.md — standar terbuka instruksi untuk agent", url: "https://agents.md/" },
            { label: "Create custom subagents — Claude Code Docs", url: "https://code.claude.com/docs/en/sub-agents" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Kenapa Multi-Agent",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Context window paling tepat digambarkan sebagai…",
            options: [
              "Kecepatan model menjawab pertanyaan",
              "Semua teks yang bisa 'dilihat' model dalam satu percakapan, termasuk balasannya",
              "Jumlah agent yang bisa berjalan bersamaan",
              "Kapasitas penyimpanan permanen akun kamu",
            ],
            correctIndex: 1,
            explanation: "Context window = seluruh input+output yang ikut diproses model saat itu, bukan penyimpanan permanen.",
          },
          {
            prompt: "Satu agent biasanya SUDAH CUKUP ketika…",
            options: [
              "Proyek menyentuh banyak folder tak berkaitan sekaligus",
              "Ada beberapa orang harus mengedit file yang sama bersamaan",
              "Tugas kecil, satu wilayah file, dan selesai dalam satu sesi wajar",
              "Kamu ingin mencoba banyak alat baru sekaligus",
            ],
            correctIndex: 2,
          },
          {
            prompt: "Peran INTEGRATOR dalam tim multi-agent bertanggung jawab untuk…",
            options: [
              "Menulis seluruh kode sendirian tanpa bantuan",
              "Menjaga papan status, mereview laporan, dan menggabungkan hasil worker",
              "Hanya mengawasi tanpa ikut memutuskan apa pun",
              "Menghapus kontribusi worker yang paling lambat",
            ],
            correctIndex: 1,
          },
          {
            prompt: "Tanda paling jelas kamu BUTUH lebih dari satu agent adalah…",
            options: [
              "Pekerjaan sudah selesai dalam hitungan menit",
              "Model sedang merespons agak lambat hari itu",
              "Pekerjaan terlalu besar/beragam untuk satu context window tanpa kehilangan fokus",
              "Kamu penasaran ingin memakai fitur baru",
            ],
            correctIndex: 2,
          },
        ],
      },
    },
    {
      title: "Kontrak & Aturan Main",
      lessons: [
        {
          title: "Menulis Dokumen Kontrak Ala AGENTS.md",
          contentMd: `## Satu file, banyak agent yang paham aturan yang sama

Cara paling praktis mengoordinasikan banyak agent (atau banyak SESI agent yang sama di waktu berbeda) adalah menulis SATU dokumen kontrak yang dibaca lebih dulu sebelum kerja dimulai. Formatnya sudah mengarah jadi standar terbuka bernama **AGENTS.md** — semacam README, tapi ditujukan untuk agent, bukan manusia.

## Isi minimal dokumen kontrak yang baik

1. **Apa proyek ini** — dalam 2-3 kalimat, tanpa jargon.
2. **Aturan keras (P0)** — hal yang TIDAK BOLEH dilanggar apa pun alasannya (mis. jangan sentuh rahasia, jangan hapus data user).
3. **Konvensi kerja** — gaya kode, penamaan file, cara commit.
4. **Wilayah kerja** — siapa boleh menulis di mana.
5. **Definisi selesai** — kapan sebuah tugas dianggap benar-benar beres.
6. **Prosedur ketika buntu** — apa yang dilakukan agent kalau menemui keputusan yang tidak bisa diambil sendiri.

> Tulis kontrak SEBELUM merekrut worker pertama, bukan setelah ada masalah. Kontrak yang ditulis reaktif (setelah insiden) cenderung jadi tumpukan aturan tambal sulam.

Latihan gratis: buat satu file instruksi di proyekmu sendiri, isi enam poin di atas — walau proyeknya masih dikerjakan sendirian. Kamu akan berterima kasih begitu proyek membesar.`,
          links: [
            { label: "AGENTS.md — standar terbuka instruksi untuk agent", url: "https://agents.md/" },
            { label: "Panduan prompt engineering — Anthropic", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
          ],
        },
        {
          title: "Konvensi Kode & Wilayah File: Zero Shared Writes",
          contentMd: `## Aturan yang menghindarkan drama terbesar: tabrakan edit

Bayangkan dua orang mengedit dokumen yang sama secara offline, lalu mencoba menggabungkan hasilnya secara manual. Itulah yang terjadi kalau dua agent menulis ke file yang sama tanpa koordinasi ketat.

Prinsip **zero shared writes**: setiap worker HANYA menulis file baru atau file yang sudah jadi wilayahnya sendiri (biasanya satu folder/fitur). File bersama (skema database, file konfigurasi utama, dokumen aturan itu sendiri) hanya boleh diubah oleh integrator, atau lewat proses "usulan" yang integrator setujui.

## Cara membagi wilayah yang jelas

- Per FITUR/vertical-slice (mis. satu worker = satu fitur end-to-end) — paling umum & paling aman.
- Per FILE BARU eksplisit (mis. "tulis TEPAT SATU file baru: nama-file.ts") — cocok untuk tugas sempit seperti data/konten.
- HINDARI membagi berdasarkan "jenis file" lintas fitur (mis. "kamu urus semua CSS, aku urus semua JS") — ini nyaris selalu berujung file yang sama disentuh dua orang.

## Konvensi kode yang mendukung kerja paralel

- Penamaan file & folder yang konsisten (dokumentasikan, jangan andalkan kebiasaan).
- Pesan commit terstruktur (mis. konvensi feat/fix/chore diikuti penjelasan singkat) — memudahkan audit siapa mengubah apa dan kenapa.
- Satu gaya penanganan error/log di seluruh proyek, supaya hasil worker berbeda tetap terasa satu produk.

> Kalau worker menemukan dirinya BUTUH mengubah file di luar wilayahnya, itu sinyal untuk berhenti dan mengusulkan perubahan ke integrator — bukan menerabas.`,
          links: [
            { label: "Conventional Commits", url: "https://www.conventionalcommits.org/en/v1.0.0/" },
            { label: "GitHub flow (alur branch & pull request)", url: "https://docs.github.com/en/get-started/quickstart/github-flow" },
          ],
        },
        {
          title: "Claim Board: Klaim Tugas Tanpa Tabrakan",
          contentMd: `## Papan yang mencegah dua orang mengerjakan hal sama

Kontrak menjawab "apa aturan mainnya". **Claim board** (papan klaim) menjawab "siapa mengerjakan apa, sekarang, dengan status apa". Bentuknya bisa sesederhana satu tabel: nomor tugas, area, status (terbuka / diklaim / dikerjakan / direview / selesai), nama agent, catatan.

## Kenapa papan ini wajib, bukan sekadar rapi-rapi

- Mencegah dua worker mengerjakan tugas yang sama tanpa sadar.
- Memberi integrator gambaran satu layar tentang seluruh proyek — tanpa harus membaca ulang semua histori percakapan.
- Menjadi jejak audit: kapan sesuatu diklaim, siapa mengerjakan, kapan selesai.

## Aturan penggunaan yang sehat

1. **Klaim SEBELUM mulai kerja** — bukan setelah selesai.
2. **Satu baris = satu unit kerja yang jelas batasnya** (bukan "kerjakan semuanya").
3. **Status jujur** — tandai "blocked" begitu buntu, jangan biarkan baris diam tanpa kabar.
4. **Klaim basi bisa diambil ulang** — tetapkan aturan waktu (mis. tanpa progres sekian jam/hari) supaya proyek tidak macet menunggu satu orang.

> Untuk proyek solo yang memakai beberapa sesi agent secara bergantian, papan ini tetap berguna — ia menjadi "memori bersama" antar sesi yang tidak saling ingat satu sama lain.`,
          links: [
            { label: "Definition of Done — Atlassian Agile Coach", url: "https://www.atlassian.com/agile/project-management/definition-of-done" },
            { label: "GitHub flow (alur branch & pull request)", url: "https://docs.github.com/en/get-started/quickstart/github-flow" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Kontrak & Aturan Main",
        passingScorePct: 65,
        questions: [
          {
            prompt: "Dokumen kontrak ala AGENTS.md paling berguna karena…",
            options: [
              "Menggantikan kebutuhan membaca kode sama sekali",
              "Memberi aturan main yang konsisten & bisa dibaca ulang setiap agent baru masuk",
              "Membuat kode berjalan lebih cepat",
              "Wajib ditulis dalam bahasa pemrograman tertentu",
            ],
            correctIndex: 1,
          },
          {
            prompt: "'Zero shared writes' berarti…",
            options: [
              "Semua agent menulis ke satu file bersama secara bergiliran",
              "Tidak ada satu pun agent yang boleh menulis kode",
              "Setiap worker hanya menulis di wilayah file miliknya sendiri — tak ada tabrakan edit",
              "File hanya boleh ditulis oleh integrator",
            ],
            correctIndex: 2,
          },
          {
            prompt: "Fungsi utama claim board (papan klaim) adalah…",
            options: [
              "Mencatat siapa mengerjakan tugas apa, agar dua agent tidak mengerjakan hal sama tanpa sadar",
              "Menyimpan kode sumber proyek",
              "Menggantikan dokumen kontrak",
              "Hanya dekorasi laporan",
            ],
            correctIndex: 0,
          },
          {
            prompt: "Kalau sebuah aturan di kontrak dilanggar oleh kode yang sudah ADA sebelumnya, sikap yang tepat (prinsip 'scope-creep guard') adalah…",
            options: [
              "Langsung memperbaikinya walau di luar tugasmu",
              "Menunjuknya, tapi hanya memperbaiki kalau memang diminta — jangan melebar dari tugas",
              "Mengabaikannya sepenuhnya",
              "Menghapus kode itu tanpa laporan",
            ],
            correctIndex: 1,
            explanation: "Fokus tetap di wilayah tugas; temuan di luar tugas dilaporkan, bukan otomatis dikerjakan.",
          },
          {
            prompt: "Konvensi commit terstruktur (mis. feat/fix/chore + penjelasan singkat) termasuk contoh dari…",
            options: [
              "Aturan main/konvensi kode yang membuat riwayat kerja mudah dibaca & diaudit",
              "Bahasa pemrograman baru",
              "Nama agent",
              "Jenis database",
            ],
            correctIndex: 0,
          },
        ],
      },
    },
    {
      title: "Menulis Prompt Assignment",
      lessons: [
        {
          title: "Anatomi Prompt Worker yang Baik",
          contentMd: `## Instruksi yang jelas = hasil yang bisa diandalkan

Prompt assignment untuk seorang worker (manusia atau agent) berbeda dari obrolan santai — ia harus lengkap dengan sendirinya, karena worker biasanya TIDAK punya akses ke percakapan yang melahirkan keputusan itu.

## Lima bagian yang sebaiknya selalu ada

1. **Peran & identitas** — siapa dia dalam tim ini, mode kerja apa yang berlaku.
2. **Batas direktori/wilayah** — file/folder mana yang boleh disentuh, dan yang TIDAK boleh disentuh sama sekali.
3. **Pola rujukan** — dokumen mana yang wajib dibaca dulu, dan contoh pola yang harus diikuti (mis. "tiru struktur file X").
4. **Definisi selesai** — kriteria konkret: pemeriksaan apa yang harus lolos, format apa yang harus dipenuhi, bagaimana cara memverifikasi sendiri.
5. **Format laporan** — bagaimana worker melapor balik: apa yang wajib disebutkan, di mana melapornya.

## Contoh kerangka ringkas

    [PERAN] Kamu agent "x" dalam proyek Y. Menulis TEPAT SATU file baru: <path>.
    [BATAS] Jangan sentuh file lain / folder lain.
    [RUJUKAN] Baca <dokumen aturan> lalu <file pola> sebagai contoh struktur.
    [TUGAS] <deskripsi konkret + isi yang diharapkan>.
    [DEFINISI SELESAI] <cara verifikasi, dan hasil yang harus benar>.
    [LAPORAN] Setelah selesai: sebutkan <daftar poin>, lalu berhenti.

Semakin konkret bagian BATAS dan DEFINISI SELESAI, semakin kecil ruang bagi worker untuk menebak — dan semakin sedikit kejutan saat direview.`,
          links: [
            { label: "Panduan prompt engineering — Anthropic", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
            { label: "AGENTS.md — standar terbuka instruksi untuk agent", url: "https://agents.md/" },
          ],
        },
        {
          title: "Anti-Pattern Umum saat Menulis Assignment",
          contentMd: `## Kesalahan yang paling sering membuat wave kerja berantakan

- **Wilayah tidak jelas** — "tolong rapikan bagian ini" tanpa menyebut file/folder persis. Worker akan menebak, dan tebakannya bisa menabrak worker lain.
- **Tidak ada definisi selesai** — tanpa kriteria konkret, worker (dan kamu) tidak punya cara objektif menilai "sudah beres".
- **Terlalu banyak tugas dalam satu assignment** — menggabungkan beberapa fitur tak berkaitan dalam satu prompt membuang keunggulan paralelisasi; pecah jadi assignment terpisah.
- **Lupa menyebut rujukan pola** — worker menulis gaya sendiri yang tidak konsisten dengan proyek; selalu tunjuk contoh nyata untuk ditiru strukturnya.
- **Tidak ada jalan keluar saat buntu** — tanpa instruksi "kalau buntu, berhenti dan laporkan", worker berisiko menebak-nebak, atau diam-diam melebar ke luar wilayahnya.
- **Melupakan aturan zero-cost/keamanan** yang berlaku di seluruh proyek — asumsikan worker TIDAK otomatis tahu aturan global kalau tidak kamu tulis ulang atau tunjuk dokumennya.

> Uji dirimu sebelum mengirim assignment: kalau prompt ini dikirim ke orang yang belum pernah melihat proyekmu sama sekali, apakah dia tahu PERSIS batas kerjanya dan kapan berhenti? Kalau ragu, tulis ulang bagian yang kabur.

Latihan gratis: ambil satu instruksi yang pernah kamu tulis untuk AI, cek terhadap enam anti-pattern di atas, revisi yang kurang.`,
          links: [
            { label: "Effective context engineering for AI agents — Anthropic", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
            { label: "Create custom subagents — Claude Code Docs", url: "https://code.claude.com/docs/en/sub-agents" },
          ],
        },
      ],
    },
    {
      title: "Review & Integrasi",
      lessons: [
        {
          title: "Membaca Laporan Worker & Verifikasi Independen",
          contentMd: `## Laporan bagus ≠ hasil benar

Worker yang menulis "semua sudah beres" belum tentu benar — bukan karena mereka berbohong, tapi karena asumsi bisa meleset, lingkungan bisa berbeda, atau cakupan verifikasi kurang luas. Prinsip inti integrator: **verifikasi independen**, bukan percaya buta.

## Checklist membaca laporan

1. Apakah laporan menyebut PERSIS file yang diubah/dibuat (bukan cuma "sudah selesai")?
2. Apakah ada bukti verifikasi (perintah yang dijalankan, hasilnya) — bukan sekadar klaim?
3. Apakah cakupannya sesuai batas assignment (tidak melebar diam-diam)?
4. Apakah ada catatan asumsi/keputusan yang diambil saat buntu?

## Verifikasi independen minimal

- Jalankan sendiri pemeriksaan otomatis yang relevan (typecheck, parse, test) dari salinan bersih — jangan hanya membaca kode sambil lalu.
- Baca isi file yang diklaim baru/berubah, bukan cuma nama filenya.
- Untuk konten/data: baca SUBSTANSINYA, bukan cuma memastikan filenya "valid secara teknis".

> Aturan sehat: tidak ada hasil yang digabungkan hanya berdasarkan laporan tanpa pengecekan independen — sekecil apa pun tugasnya.`,
          links: [
            { label: "Google eng-practices — panduan code review", url: "https://google.github.io/eng-practices/review/" },
            { label: "Definition of Done — Atlassian Agile Coach", url: "https://www.atlassian.com/agile/project-management/definition-of-done" },
          ],
        },
        {
          title: "Menangani Konflik & Drift",
          contentMd: `## Ketika kenyataan tidak lagi cocok dengan asumsi

**Drift** terjadi ketika kondisi nyata proyek (isi file, hasil kerja worker lain, keputusan yang berubah) perlahan tidak lagi sesuai dengan apa yang diasumsikan saat assignment ditulis. Ini normal dalam kerja paralel — bukan tanda kegagalan, tapi sinyal untuk berhenti sejenak dan menyelaraskan.

## Sumber konflik yang umum

- Dua worker mengasumsikan struktur yang sama tapi ternyata berbeda interpretasi.
- Dokumen aturan berubah SETELAH sebuah assignment dikirim.
- Lingkungan kerja (mis. salinan file yang dibaca worker) tidak selalu identik dengan sumber kebenaran.

## Cara menangani, langkah demi langkah

1. **Catat driftnya secara eksplisit** — jangan diam-diam ditambal; tulis di log/papan status supaya semua pihak sadar.
2. **Bandingkan ke sumber kebenaran** — dokumen kontrak dan definisi selesai, bukan ingatan atau asumsi siapa pun.
3. **Selaraskan ulang sebelum lanjut** — perbaiki dokumen atau file yang menyimpang, baru lanjutkan pekerjaan berikutnya.
4. **Jangan rute-kan aturan keras** — kalau konfliknya menyentuh aturan keamanan/data, berhenti dan eskalasi, jangan mencari jalan pintas.

> Tim yang sehat bukan yang tidak pernah drift — tapi yang punya kebiasaan MENEMUKAN dan MENDOKUMENTASIKAN drift lebih cepat dari yang menumpuknya.`,
          links: [
            { label: "GitHub flow (alur branch & pull request)", url: "https://docs.github.com/en/get-started/quickstart/github-flow" },
            { label: "Conventional Commits", url: "https://www.conventionalcommits.org/en/v1.0.0/" },
          ],
        },
        {
          title: "Kapan Menolak Hasil Worker",
          contentMd: `## Menolak itu bagian normal dari proses, bukan kegagalan

Integrator yang baik berani bilang "belum bisa digabung" — asal alasannya jelas dan bisa diperbaiki. Menolak DENGAN alasan konkret jauh lebih sehat daripada menggabung hasil yang meragukan demi "cepat selesai".

## Alasan sah untuk menolak

- Melanggar aturan keras (menyentuh wilayah terlarang, mengubah data yang tidak boleh diubah).
- Tidak lolos verifikasi independen (pemeriksaan gagal, atau ternyata tidak benar-benar dites).
- Melebar dari batas assignment tanpa persetujuan.
- Kualitas konten/logika di bawah standar proyek meski "secara teknis jalan".

## Alasan yang BUKAN dasar penolakan yang sehat

- Gaya penulisan sedikit berbeda tapi tetap konsisten dengan konvensi.
- Worker menyelesaikan lebih cepat/lebih lambat dari perkiraan.
- Preferensi pribadi kecil yang tidak tertulis di kontrak/definisi selesai.

## Cara menolak dengan baik

Sebutkan PERSIS bagian yang bermasalah, rujuk aturan/definisi selesai mana yang tidak terpenuhi, dan beri jalan konkret untuk memperbaiki (bukan sekadar "coba lagi"). Ini yang membuat worker — atau dirimu sendiri di sesi berikutnya — belajar, bukan menebak-nebak lagi.`,
          links: [
            { label: "The Standard of Code Review — Google eng-practices", url: "https://google.github.io/eng-practices/review/reviewer/standard.html" },
            { label: "Definition of Done — Atlassian Agile Coach", url: "https://www.atlassian.com/agile/project-management/definition-of-done" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Review & Integrasi",
        passingScorePct: 65,
        questions: [
          {
            prompt: "Langkah PALING penting sebelum menerima laporan 'sudah beres' dari worker adalah…",
            options: [
              "Percaya penuh karena worker jarang salah",
              "Verifikasi independen — jalankan sendiri pemeriksaan, jangan hanya percaya klaim",
              "Langsung gabungkan tanpa dibaca",
              "Meminta worker mengulang tugas dari nol",
            ],
            correctIndex: 1,
          },
          {
            prompt: "'Drift' dalam konteks multi-agent paling tepat berarti…",
            options: [
              "Kecepatan internet menurun",
              "Kondisi nyata (file/lingkungan kerja) perlahan tak lagi cocok dengan yang diasumsikan/dilaporkan",
              "Agent yang berhenti bekerja",
              "Fitur baru yang sengaja ditambahkan",
            ],
            correctIndex: 1,
          },
          {
            prompt: "Saat dua worker mengklaim sudah mengerjakan hal yang saling bertentangan, langkah integrator yang tepat…",
            options: [
              "Menggabungkan keduanya tanpa dicek",
              "Memilih salah satu secara acak",
              "Membandingkan hasil terhadap kontrak & definisi selesai, lalu memutuskan mana yang konsisten",
              "Meminta keduanya berhenti bekerja selamanya",
            ],
            correctIndex: 2,
          },
          {
            prompt: "Sebuah hasil kerja LAYAK ditolak ketika…",
            options: [
              "Hasilnya sedikit berbeda gaya penulisan dari punyamu",
              "Melanggar aturan keras (mis. menyentuh wilayah file terlarang) atau tidak lolos verifikasi independen",
              "Worker menyelesaikannya lebih cepat dari perkiraan",
              "Laporannya terlalu ringkas tapi isinya benar",
            ],
            correctIndex: 1,
            explanation: "Gaya, kecepatan, dan panjang laporan bukan alasan sah — pelanggaran aturan/gagal verifikasi yang sah.",
          },
        ],
      },
    },
    {
      title: "Studi Kasus: Platform Ini",
      lessons: [
        {
          title: "Alur Satu Wave: Pre-Work sampai Assignment",
          contentMd: `## Cerita nyata, bukan teori

Kelas yang sedang kamu baca ini pun ditulis lewat pola yang sama dengan yang kamu pelajari di modul-modul sebelumnya. Platform belajar tempatmu duduk sekarang dibangun bertahap, wave demi wave, dengan tim agent — bukan satu sesi maraton tunggal.

## Bentuk satu "wave" kerja

1. **Pre-work (integrator)** — menulis/memutakhirkan dokumen kontrak, memutuskan pembagian wilayah, menyiapkan papan status dengan baris-baris tugas yang jelas batasnya.
2. **Assignment ditulis per worker** — masing-masing dapat SATU wilayah kerja sempit (mis. satu fitur, atau bahkan cuma satu file baru untuk tugas yang sangat sempit), lengkap dengan rujukan pola yang harus ditiru dan definisi selesainya.
3. **Klaim dicatat** SEBELUM worker mulai — supaya jelas siapa mengerjakan apa.

> Perhatikan urutannya: rencana dan aturan datang DULU, baru pekerjaan dibagi. Wave yang mulai dari "bagi tugas dulu, aturan menyusul" cenderung berantakan di tengah jalan.

Latihan gratis: untuk proyek kecilmu sendiri, coba tuliskan satu "wave" — walau workernya cuma kamu sendiri di sesi berbeda-beda. Rasakan bedanya dibanding kerja tanpa rencana tertulis.`,
          links: [
            { label: "AGENTS.md — standar terbuka instruksi untuk agent", url: "https://agents.md/" },
            { label: "Panduan prompt engineering — Anthropic", url: "https://docs.claude.com/en/docs/build-with-claude/prompt-engineering/overview" },
          ],
        },
        {
          title: "3–5 Worker Paralel → Review",
          contentMd: `## Paralel bukan berarti tanpa kendali

Begitu beberapa worker bekerja bersamaan, masing-masing di wilayahnya sendiri (zero shared writes dari Modul 2), integrator TIDAK diam menunggu — ia memantau papan status, siap menjawab kalau ada worker yang buntu, dan mulai mereview begitu laporan pertama masuk.

## Pola review yang dipakai

- **Baca isi**, bukan cuma judul laporan — terutama untuk pekerjaan yang berbasis konten/data, substansi lebih penting daripada "filenya ada".
- **Verifikasi independen** dari salinan bersih (bukan mempercayai lingkungan kerja worker apa adanya) — persis prinsip Modul 4.
- **Bandingkan ke definisi selesai** yang tertulis di assignment masing-masing, bukan standar yang baru terpikir saat review.
- **Catat temuan** (termasuk drift/konflik) di log yang bisa dirujuk wave berikutnya — supaya pelajaran tidak hilang begitu sesi berakhir.

## Kenapa 3-5, bukan 20

Ada titik di mana menambah worker paralel justru menambah beban KOORDINASI lebih cepat daripada menambah kecepatan kerja. Rentang kecil (beberapa worker per wave) membuat satu integrator masih sanggup mereview semuanya dengan cermat — bukan sekadar mengintip sekilas.`,
          links: [
            { label: "Subagents in the SDK — Claude API Docs", url: "https://platform.claude.com/docs/en/agent-sdk/subagents" },
            { label: "Google eng-practices — panduan code review", url: "https://google.github.io/eng-practices/review/" },
          ],
        },
        {
          title: "Deploy & Pelajaran yang Bisa Kamu Tiru",
          contentMd: `## Menutup satu wave dengan rapi

Setelah hasil worker direview dan digabung, langkah terakhir biasanya dipisah lagi menjadi peran tersendiri: menjalankan langkah operasional (build, jalankan pemeriksaan akhir, publikasikan) dengan wewenang yang sengaja dibatasi sempit — supaya siapa pun bisa melacak persis apa yang dijalankan dan kenapa.

## Pelajaran yang bisa langsung kamu tiru, gratis, di proyekmu sendiri

1. **Tulis kontrak dulu**, walau proyeknya kecil — satu file cukup untuk mulai.
2. **Bagi wilayah eksplisit** setiap kali kamu memakai lebih dari satu sesi agent, bahkan kalau semua sesi itu "cuma kamu".
3. **Pakai papan status sederhana** (tabel di satu dokumen sudah cukup) supaya kamu tidak lupa apa yang sedang/sudah dikerjakan.
4. **Jangan lewati verifikasi independen** — ini bagian yang paling sering dikorbankan saat terburu-buru, dan paling sering menyelamatkan proyek saat dipatuhi.
5. **Pisahkan "siapa memutuskan" dari "siapa menjalankan"** untuk langkah-langkah berisiko (mis. publikasi) — bukan karena tidak percaya, tapi supaya jejaknya jelas.

> Kamu baru saja mempelajari pola yang benar-benar dipakai untuk membangun tempat kamu belajar hari ini. Sekarang giliranmu: proyek apa pun yang sedang kamu kerjakan, mulai dari kontrak satu halaman, dan biarkan pola ini bertumbuh seiring kebutuhan.

Selamat menyelesaikan kelas ini — bawa polanya, bukan cuma istilahnya, ke proyek berikutnya.`,
          links: [
            { label: "GitHub flow (alur branch & pull request)", url: "https://docs.github.com/en/get-started/quickstart/github-flow" },
            { label: "Conventional Commits", url: "https://www.conventionalcommits.org/en/v1.0.0/" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Studi Kasus Platform Ini",
        passingScorePct: 70,
        questions: [
          {
            prompt: "Dalam satu 'wave' kerja multi-agent, urutan yang paling masuk akal adalah…",
            options: [
              "Deploy dulu, baru rencanakan tugas",
              "Pre-work (rencana & kontrak) → beberapa worker paralel → review → deploy",
              "Semua agent bekerja tanpa rencana, baru dirapikan belakangan",
              "Review dulu sebelum ada pekerjaan yang dikerjakan",
            ],
            correctIndex: 1,
          },
          {
            prompt: "Alasan tiap worker diberi wilayah file SENDIRI (bukan berbagi file yang sama) adalah…",
            options: [
              "Supaya kode terlihat lebih banyak",
              "Menghindari tabrakan tulis (edit saling menimpa) saat bekerja paralel",
              "Karena aturan proyek melarang kerja sama",
              "Supaya integrator tidak perlu review",
            ],
            correctIndex: 1,
          },
          {
            prompt: "Peran khusus yang HANYA menjalankan langkah operasional (mis. menjalankan perintah publikasi) dan tidak menulis logika aplikasi, dengan wewenang sengaja dibatasi sempit, disebut…",
            options: [
              "Worker biasa",
              "Integrator",
              "Peran ops/operasional dengan wewenang sempit & bisa dipertanggungjawabkan",
              "Reviewer eksternal",
            ],
            correctIndex: 2,
          },
          {
            prompt: "Pelajaran paling penting yang bisa kamu TIRU dari studi kasus ini untuk proyekmu sendiri adalah…",
            options: [
              "Multi-agent hanya cocok untuk perusahaan besar",
              "Pola kontrak + wilayah kerja jelas + review independen bisa diterapkan di proyek kecil sekalipun",
              "Semua proyek wajib memakai lima agent sejak hari pertama",
              "Review bisa dilewati kalau tergesa-gesa",
            ],
            correctIndex: 1,
          },
        ],
      },
    },
  ],
};

export const seedMultiAgentContent = internalMutation({
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
      note: "multi-agent orchestration curriculum seeded (idempotent per course slug)",
    };
  },
});
