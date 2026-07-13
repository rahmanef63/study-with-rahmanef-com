// Seed kurikulum "Bikin Aplikasi Web dengan AI" — dari nol (HTML/CSS/JS) sampai
// deploy. Internal-only; jalankan SETELAH seed:bootstrap:
//
//   npx convex run seedWebDev:seedWebDevContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}' --prod
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
  slug: "bikin-aplikasi-web-dengan-ai",
  title: "Bikin Aplikasi Web dengan AI — dari Nol sampai Live",
  description:
    "Jalur lengkap untuk non-programmer: pahami HTML/CSS/JS secukupnya, kuasai context & harness engineering, lalu bangun aplikasi React + Next.js + Convex bersama AI dan deploy ke Vercel/Netlify.",
  modules: [
    {
      title: "Fondasi Web: HTML, CSS, JavaScript",
      lessons: [
        {
          title: "HTML: kerangka halaman",
          contentMd: `## Halaman web = dokumen berstruktur

HTML memberi MAKNA pada isi: judul, paragraf, tombol, formulir. Kamu tidak perlu hafal semua tag — kamu perlu bisa MEMBACANYA, karena AI yang akan menulis sebagian besar untukmu.

Contoh kerangka paling dasar:

    <!doctype html>
    <html>
      <head><title>Halo</title></head>
      <body>
        <h1>Judul besar</h1>
        <p>Sebuah paragraf.</p>
        <button>Klik aku</button>
      </body>
    </html>

## Yang wajib kamu kenali

- **h1..h6** judul · **p** paragraf · **a** tautan · **img** gambar
- **div / section** kotak pengelompokan · **form + input + button** interaksi
- Atribut: **href**, **src**, **class**, **id**

> Latihan dengan AI: minta "buatkan halaman profil sederhana dengan foto, nama, dan 3 tautan sosial" lalu BACA hasilnya baris per baris dan tanyakan apa pun yang asing.`,
          links: [
            { label: "MDN — Dasar HTML", url: "https://developer.mozilla.org/id/docs/Learn/HTML" },
          ],
        },
        {
          title: "CSS: tampilan dan tata letak",
          contentMd: `## CSS mengatur RASA halaman

Selector memilih elemen, properti mengubah gayanya:

    h1 { color: darkgreen; }
    .kartu {
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,.08);
    }

## Konsep yang paling sering kamu sentuh

- **Box model**: margin (luar) → border → padding (dalam) → isi
- **Flexbox** untuk menyusun sejajar; **grid** untuk susunan dua arah
- **Responsive**: mulai dari layar kecil, perlebar dengan media query

Di proyek modern kamu akan sering bertemu **Tailwind CSS** — utility class seperti **p-4**, **rounded-xl**, **flex** yang menggantikan file CSS panjang. Prinsipnya sama; hanya cara menulisnya yang ringkas.

> Latihan dengan AI: berikan screenshot desain yang kamu suka dan minta AI menirunya dengan Tailwind, lalu ubah-ubah nilainya untuk merasakan efeknya.`,
          links: [
            { label: "MDN — Dasar CSS", url: "https://developer.mozilla.org/id/docs/Learn/CSS" },
            { label: "Tailwind CSS", url: "https://tailwindcss.com/docs" },
          ],
        },
        {
          title: "JavaScript: logika dan interaksi",
          contentMd: `## JS membuat halaman HIDUP

Variabel, fungsi, kondisi, perulangan — empat bahan dasar semua logika:

    const nama = "Rahman";
    function sapa(siapa) {
      if (!siapa) return "Halo, teman!";
      return "Halo, " + siapa + "!";
    }
    console.log(sapa(nama));

## Konsep kunci untuk era AI

- **Event**: kode berjalan saat sesuatu terjadi (klik, ketik, submit)
- **Async/await**: menunggu data dari server tanpa membekukan halaman
- **JSON**: format data universal antara browser ↔ server ↔ AI
- **Error membaca**: pesan error adalah PETUNJUK, bukan hukuman — salin ke AI dan minta penjelasan + perbaikan

> Kamu tidak harus jago menulis JS dari nol. Targetmu: MEMBACA kode yang AI tulis, memahami alurnya, dan tahu di mana memintanya mengubah.`,
          links: [
            { label: "MDN — Dasar JavaScript", url: "https://developer.mozilla.org/id/docs/Learn/JavaScript" },
            { label: "javascript.info", url: "https://javascript.info" },
          ],
        },
      ],
      quiz: {
        title: "Kuis: Fondasi Web",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Peran utama HTML adalah…",
            options: ["Mengatur warna", "Memberi struktur & makna konten", "Menyimpan database", "Menjalankan logika"],
            correctIndex: 1,
            explanation: "HTML = struktur/makna; CSS = tampilan; JS = logika.",
          },
          {
            prompt: "Urutan box model dari luar ke dalam…",
            options: ["padding → border → margin", "margin → border → padding", "border → margin → padding", "isi → margin → border"],
            correctIndex: 1,
          },
          {
            prompt: "async/await dipakai untuk…",
            options: ["Membuat animasi", "Menunggu operasi (mis. ambil data) tanpa membekukan halaman", "Mengganti CSS", "Menulis HTML"],
            correctIndex: 1,
          },
          {
            prompt: "Saat bertemu error, langkah paling produktif bersama AI adalah…",
            options: ["Hapus semua kode", "Abaikan errornya", "Salin pesan error + kode terkait, minta penjelasan & perbaikan", "Restart komputer"],
            correctIndex: 2,
          },
        ],
      },
    },
    {
      title: "Context Engineering: memberi AI bahan yang tepat",
      lessons: [
        {
          title: "Kenapa konteks menentukan segalanya",
          contentMd: `## AI hanya sebaik konteksnya

Model tidak melihat proyekmu — ia hanya melihat apa yang kamu TEMPELKAN ke percakapan. Context engineering = seni memilih, menyusun, dan menghemat bahan itu.

## Prinsip praktis

1. **Relevan > banyak.** 50 baris kode yang tepat mengalahkan 5 file penuh.
2. **Nyatakan tujuan + batasan** sebelum kode: "ubah X, JANGAN sentuh Y".
3. **Beri contoh hasil** yang kamu mau (few-shot) untuk format yang konsisten.
4. **Konteks membusuk**: percakapan panjang membuat instruksi awal terlupa — rangkum ulang atau mulai sesi baru dengan ringkasan.
5. **Satu sumber kebenaran**: kalau ada dokumen keputusan (PRD, konvensi), tempelkan potongan relevannya, jangan mengandalkan ingatan AI.

> Uji dirimu: sebelum bertanya ke AI, tuliskan dulu — apa yang kubuat, apa yang salah/kubutuhkan, kode/dokumen mana yang relevan, hasil seperti apa yang kuharapkan.`,
        },
        {
          title: "Pola konteks untuk proyek nyata",
          contentMd: `## Menyusun \"paket konteks\" per permintaan

Struktur yang terbukti enak dibaca model:

    [PERAN] Kamu adalah developer Next.js senior di proyek X.
    [KONTEKS] Stack: Next.js + Convex. File terkait: (tempel kode)
    [ATURAN] Ikuti konvensi ini: (tempel aturan yang relevan)
    [TUGAS] Tambahkan fitur ... dengan perilaku ...
    [FORMAT] Balas dengan: rencana singkat, lalu kode per file.

## Trik yang sering menyelamatkan

- **Sebut nama file & fungsi** persis — AI jadi bisa \"menunjuk\" lokasi yang sama denganmu.
- **Tempel error apa adanya** (jangan diketik ulang / dipotong).
- **Minta rencana dulu** untuk tugas besar, setujui, baru minta kode.
- **Minta AI bertanya** bila ada yang ambigu, daripada menebak.`,
        },
        {
          title: "Batas konteks & strategi proyek besar",
          contentMd: `## Saat proyek melebihi satu percakapan

- **Dokumen jangkar**: simpan keputusan penting (arsitektur, konvensi, glosarium) di satu file yang selalu ditempel/diacu di tiap sesi baru.
- **Ringkasan estafet**: akhiri sesi dengan \"ringkas keadaan + langkah berikutnya\", tempel ringkasan itu di sesi berikutnya.
- **Potong per fitur**: satu sesi = satu fitur/perbaikan; hasilnya di-commit sebelum lanjut.
- **Jangan tempel rahasia**: API key & password tidak pernah masuk percakapan.

Platform tempat kamu belajar ini pun dibangun persis dengan pola tersebut — dokumen kontrak + papan status + sesi agent per fitur.`,
        },
      ],
    },
    {
      title: "Harness Engineering: membangun \"kandang kerja\" untuk AI agent",
      lessons: [
        {
          title: "Dari chat ke agent: apa itu harness",
          contentMd: `## Harness = lingkungan + aturan + alat untuk agent

Chat biasa: kamu tempel kode, AI membalas teks. **Agent**: AI yang bisa membaca file proyekmu, menjalankan perintah, mengedit kode, dan mengetes hasilnya sendiri (contoh: Claude Code). Harness engineering = merancang \"kandang\" agar agent bekerja benar TANPA diawasi tiap detik.

## Komponen harness yang baik

1. **File instruksi proyek** (mis. CLAUDE.md / AGENTS.md): siapa dia, aturan main, gaya kode, apa yang haram disentuh.
2. **Batas wilayah**: folder mana yang boleh ditulis; rahasia disimpan di env, bukan di repo.
3. **Alat verifikasi**: test, typecheck, lint — agent harus bisa MENGECEK dirinya.
4. **Definisi selesai**: kapan pekerjaan dianggap beres (test hijau? build lolos?).
5. **Jejak**: commit kecil-kecil dengan pesan jelas, supaya mudah diaudit & di-rollback.`,
        },
        {
          title: "Menulis instruksi agent yang efektif",
          contentMd: `## Pola instruksi yang terbukti

    # Peran & misi
    Kamu agent developer di proyek <nama>. Tujuan: <hasil>.

    # Aturan keras (jangan pernah dilanggar)
    - Jangan sentuh folder <x>; jangan commit rahasia.
    - Setiap selesai: jalankan test & typecheck, laporkan hasil.

    # Konvensi
    - <gaya penamaan, struktur folder, library yang dipakai>

    # Definisi selesai
    - Test hijau, build lolos, laporan ringkas perubahan.

## Pelajaran lapangan

- **Aturan yang tidak ditulis akan dilanggar.** Tulis semua asumsi.
- **Beri jalan keluar**: \"kalau buntu, berhenti dan tanya\" mencegah agent ngawur.
- **Iterasi**: tiap kali agent salah, ubah INSTRUKSINYA — bukan hanya hasilnya — supaya kesalahan tidak terulang.
- **Multi-agent**: pecah pekerjaan per wilayah (satu agent satu folder/fitur) agar tidak saling timpa.`,
        },
        {
          title: "Loop kerja bersama agent",
          contentMd: `## Ritme harian yang sehat

1. **Rencana kecil** — tulis 1-3 tugas jelas.
2. **Serahkan ke agent** dengan konteks + definisi selesai.
3. **Review hasil** — baca diff, jalankan aplikasi, uji manual sedikit.
4. **Commit** bila baik; kembalikan dengan catatan bila belum.
5. **Rawat instruksi** — pindahkan pelajaran hari ini ke file instruksi proyek.

## Tanda bahaya

- Diff raksasa yang tak kamu pahami → minta pecah lebih kecil.
- \"Katanya sudah dites\" tanpa bukti → minta output test-nya.
- Perubahan di luar wilayah tugas → perketat batas di instruksi.

> Intinya: kamu naik jabatan dari \"penulis kode\" menjadi \"manajer + reviewer\". Kualitas hasil = kualitas instruksi + kualitas review-mu.`,
        },
      ],
      quiz: {
        title: "Kuis: Context & Harness",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Inti context engineering adalah…",
            options: ["Menempel sebanyak mungkin file", "Memilih & menyusun bahan yang relevan untuk AI", "Menghafal prompt ajaib", "Memakai model terbesar"],
            correctIndex: 1,
          },
          {
            prompt: "Untuk tugas besar, langkah paling aman…",
            options: ["Langsung minta semua kode", "Minta rencana dulu, setujui, baru kode", "Biarkan AI bebas", "Kerjakan manual semua"],
            correctIndex: 1,
          },
          {
            prompt: "Harness engineering TIDAK mencakup…",
            options: ["File instruksi proyek", "Batas wilayah kerja agent", "Alat verifikasi (test/typecheck)", "Menyimpan API key di dalam repo"],
            correctIndex: 3,
            explanation: "Rahasia justru dilarang masuk repo/percakapan.",
          },
          {
            prompt: "Bila agent melakukan kesalahan berulang, perbaikan terbaik adalah…",
            options: ["Marahi agentnya", "Perbaiki hasilnya saja tiap kali", "Perbaiki instruksi/harness agar kesalahan tak terulang", "Ganti laptop"],
            correctIndex: 2,
          },
        ],
      },
    },
    {
      title: "React: cara berpikir komponen",
      lessons: [
        {
          title: "Komponen, props, dan state",
          contentMd: `## UI = fungsi dari data

React menyusun antarmuka dari **komponen** — fungsi yang menerima **props** (masukan) dan mengembalikan tampilan:

    function Salam({ nama }) {
      return <h1>Halo, {nama}!</h1>;
    }

**State** = data yang berubah dan membuat tampilan ikut berubah:

    function Penghitung() {
      const [angka, setAngka] = useState(0);
      return (
        <button onClick={() => setAngka(angka + 1)}>
          Diklik {angka} kali
        </button>
      );
    }

## Mental model

- Data mengalir KE BAWAH lewat props; kejadian naik lewat callback.
- Ubah state → React menggambar ulang — kamu tidak menyentuh DOM manual.
- Komponen kecil & fokus = mudah dipahami AI maupun manusia.`,
          links: [{ label: "react.dev — Belajar React", url: "https://react.dev/learn" }],
        },
        {
          title: "Hooks penting & pola sehari-hari",
          contentMd: `## Tiga hook yang menutup 90% kebutuhan

- **useState** — data lokal komponen.
- **useEffect** — efek samping (jarang dibutuhkan bila pakai library data yang reaktif; hati-hati menjadikannya tempat fetch).
- **Custom hook** — bungkus logika berulang jadi **useNamaSesuatu**.

## Pola yang sering kamu minta ke AI

- \"Pecah komponen ini jadi lebih kecil\"
- \"Angkat state ini ke induk karena dipakai dua anak\"
- \"Ganti kondisi if-else berantai jadi map/lookup\"
- \"Tambahkan loading & empty state\"

> Membaca komponen orang lain (atau buatan AI) adalah skill inti: cari dulu PROPS-nya (apa masukannya), STATE-nya (apa yang berubah), lalu RETURN-nya (apa yang tampil).`,
        },
      ],
    },
    {
      title: "Next.js: dari komponen jadi aplikasi",
      lessons: [
        {
          title: "Routing & struktur app",
          contentMd: `## File = rute

Di Next.js (App Router), struktur folder **app/** menentukan URL:

    app/page.tsx          →  /
    app/tentang/page.tsx  →  /tentang
    app/kelas/[slug]/page.tsx → /kelas/apa-saja

Elemen penting:

- **layout.tsx** — bingkai yang membungkus banyak halaman (header/footer).
- **loading.tsx / error.tsx / not-found.tsx** — state sistem per rute.
- **Link** dari next/link untuk pindah halaman tanpa reload.`,
          links: [{ label: "Dokumentasi Next.js", url: "https://nextjs.org/docs" }],
        },
        {
          title: "Server vs Client Component",
          contentMd: `## Dua dunia dalam satu aplikasi

- **Server Component** (default): dirender di server; boleh baca database/rahasia; TIDAK bisa pakai useState/onClick.
- **Client Component** (tandai **\"use client\"** di baris pertama): interaktif di browser; jangan taruh rahasia di sini.

Aturan praktis: mulai semua sebagai server component; turunkan ke client HANYA bagian yang butuh interaksi.

## Env & rahasia

- Variabel berawalan **NEXT_PUBLIC_** ikut terkirim ke browser — hanya untuk nilai yang memang publik.
- API key/rahasia: tanpa prefix itu, dan hanya dipakai di sisi server.`,
        },
      ],
      quiz: {
        title: "Kuis: React & Next.js",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Props pada komponen React adalah…",
            options: ["Data masukan dari induk", "Database", "File CSS", "Nama fungsi wajib"],
            correctIndex: 0,
          },
          {
            prompt: "Mengubah state akan…",
            options: ["Mematikan aplikasi", "Membuat React menggambar ulang tampilan", "Menghapus props", "Mengubah URL"],
            correctIndex: 1,
          },
          {
            prompt: "app/kelas/[slug]/page.tsx melayani URL…",
            options: ["/kelas saja", "/kelas/apa-pun-nilai-slug", "/slug/kelas", "/[slug]"],
            correctIndex: 1,
          },
          {
            prompt: "Yang BENAR tentang env di Next.js…",
            options: ["Semua env aman dari browser", "NEXT_PUBLIC_ ikut ke browser — jangan taruh rahasia", "Rahasia sebaiknya ditulis di komponen client", "Env tidak bisa dipakai"],
            correctIndex: 1,
          },
        ],
      },
    },
    {
      title: "Convex: backend realtime tanpa pusing server",
      lessons: [
        {
          title: "Schema, query, mutation",
          contentMd: `## Tiga pilar Convex

- **Schema** — bentuk tabel + index, ditulis di **convex/schema.ts**.
- **Query** — membaca data; otomatis REAKTIF (UI ikut berubah saat data berubah).
- **Mutation** — menulis data; transaksional.

Contoh rasa kodenya:

    export const listTugas = query({
      args: { selesai: v.boolean() },
      handler: async (ctx, args) => {
        return await ctx.db
          .query("tugas")
          .withIndex("by_selesai", (q) => q.eq("selesai", args.selesai))
          .take(50);
      },
    });

Di React: **useQuery(api.tugas.listTugas, { selesai: false })** — tanpa websocket manual, tanpa refresh.`,
          links: [{ label: "Dokumentasi Convex", url: "https://docs.convex.dev" }],
        },
        {
          title: "Keamanan: validasi & otorisasi di server",
          contentMd: `## Dua kebiasaan yang tidak boleh ditawar

1. **Validasi argumen** dengan v.* di SETIAP fungsi publik — jangan percaya input client.
2. **Cek siapa pemanggilnya** (auth) di awal handler sebelum membaca/menulis data orang.

    export const hapusCatatan = mutation({
      args: { id: v.id("catatan") },
      handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);   // siapa dia?
        if (!userId) throw new Error("Harus login");
        const row = await ctx.db.get(args.id);
        if (row?.pemilik !== userId) throw new Error("Bukan milikmu");
        await ctx.db.delete(args.id);
      },
    });

> Tampilan boleh menyembunyikan tombol, tapi KEAMANAN sesungguhnya selalu di server. Platform ini pun dibangun dengan aturan itu.`,
        },
      ],
    },
    {
      title: "Deploy: naikkan aplikasimu ke internet",
      lessons: [
        {
          title: "Vercel / Netlify: dari repo ke URL",
          contentMd: `## Alur yang sama di keduanya

1. Push kode ke **GitHub**.
2. Buka Vercel/Netlify → **Import project** → pilih repo.
3. Platform mendeteksi Next.js otomatis → **Deploy**.
4. Setiap push ke branch utama = deploy baru otomatis; preview URL untuk tiap perubahan.

## Env variables di produksi

Set lewat dashboard (Settings → Environment Variables): nilai **NEXT_PUBLIC_CONVEX_URL**, kunci rahasia, dst. Ubah env = perlu redeploy.

## Untuk backend Convex

Jalankan **npx convex deploy** untuk mendorong schema+functions ke deployment produksi Convex, lalu pastikan URL produksinya yang dipakai di env hosting.`,
          links: [
            { label: "Vercel", url: "https://vercel.com/docs" },
            { label: "Netlify", url: "https://docs.netlify.com" },
          ],
        },
        {
          title: "Domain, cek terakhir, dan merawat aplikasi live",
          contentMd: `## Sebelum kamu sebarkan link-nya

- **Domain**: tambah custom domain di dashboard, arahkan DNS (A/CNAME) sesuai instruksi — HTTPS otomatis.
- **Smoke test**: buka halaman utama, login, satu alur inti — di HP juga.
- **Error nyata**: cek log dashboard hosting + dashboard Convex saat ada laporan aneh.

## Kebiasaan aplikasi yang panjang umur

- Perubahan kecil & sering, bukan raksasa & jarang.
- Rahasia dirotasi bila pernah bocor; jangan pernah commit .env.
- Tulis runbook singkat: cara deploy, cara rollback, siapa memegang akses.

Selamat — dari nol sampai LIVE. Ulangi seluruh loop-nya bersama AI untuk ide aplikasimu sendiri, dan bagikan hasilnya di komunitas!`,
        },
      ],
      quiz: {
        title: "Kuis: Convex & Deploy",
        passingScorePct: 60,
        questions: [
          {
            prompt: "Query di Convex bersifat…",
            options: ["Sekali baca lalu basi", "Reaktif — UI ikut berubah saat data berubah", "Hanya untuk admin", "Tidak bisa difilter"],
            correctIndex: 1,
          },
          {
            prompt: "Tempat KEAMANAN yang sesungguhnya adalah…",
            options: ["Menyembunyikan tombol di UI", "Validasi + cek auth di server (dalam fungsi)", "Komentar kode", "Nama variabel"],
            correctIndex: 1,
          },
          {
            prompt: "Alur deploy modern ke Vercel/Netlify…",
            options: ["Upload zip manual tiap rilis", "Push ke GitHub → platform build & deploy otomatis", "Kirim file via email", "Copy-paste kode ke dashboard"],
            correctIndex: 1,
          },
          {
            prompt: "Env variable rahasia sebaiknya…",
            options: ["Ditulis di kode agar mudah", "Diset di dashboard hosting, tanpa prefix NEXT_PUBLIC_", "Ditaruh di README", "Dikirim ke grup chat"],
            correctIndex: 1,
          },
        ],
      },
    },
  ],
};

export const seedWebDevContent = internalMutation({
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
      note: "web-dev curriculum seeded (idempotent per course slug)",
    };
  },
});
