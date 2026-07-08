// One-shot bootstrap for the first tenant (STATUS.md #0 "seed first tenant").
// Internal-only: not callable from clients. Run AFTER the owner has logged in
// once with Google, from the CLI:
//
//   npx convex run seed:bootstrap '{
//     "ownerEmail": "rahmanef63@gmail.com",
//     "username": "rahman",
//     "displayName": "Rahman",
//     "tenantSlug": "belajar-ai",
//     "tenantName": "Belajar AI bareng Rahman",
//     "tenantDescription": "Komunitas belajar pengaplikasian AI untuk semua orang."
//   }'
//
// Idempotent: safe to re-run; existing rows are kept.
import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

export const bootstrap = internalMutation({
  args: {
    ownerEmail: v.string(),
    username: v.string(),
    displayName: v.string(),
    tenantSlug: v.string(),
    tenantName: v.string(),
    tenantDescription: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.ownerEmail))
      .unique();
    if (user === null) {
      throw new Error(
        `No user with email ${args.ownerEmail} — log in once with Google first, then re-run.`
      );
    }

    let profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .unique();
    if (profile === null) {
      const profileId = await ctx.db.insert("profiles", {
        userId: user._id,
        username: args.username,
        displayName: args.displayName,
        isPlatformAdmin: true,
      });
      profile = await ctx.db.get(profileId);
    } else if (profile.isPlatformAdmin !== true) {
      await ctx.db.patch(profile._id, { isPlatformAdmin: true });
    }

    let tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();
    if (tenant === null) {
      const tenantId = await ctx.db.insert("tenants", {
        slug: args.tenantSlug,
        name: args.tenantName,
        description: args.tenantDescription,
        status: "active",
        ownerId: user._id,
      });
      tenant = await ctx.db.get(tenantId);
    }
    if (tenant === null) throw new Error("unreachable: tenant insert failed");

    const membership = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", tenant._id).eq("userId", user._id)
      )
      .unique();
    if (membership === null) {
      await ctx.db.insert("memberships", {
        tenantId: tenant._id,
        userId: user._id,
        role: "owner",
      });
    }

    return {
      userId: user._id,
      tenantId: tenant._id,
      tenantSlug: tenant.slug,
      note: "bootstrap complete (idempotent)",
    };
  },
});

// ── content seed (STATUS: "seed materi") ─────────────────────────────────────
// Fills the bootstrapped tenant with real starter courses/lessons/quizzes +
// a welcome announcement, all authored by the owner. Internal-only; run AFTER
// seed:bootstrap:
//
//   npx convex run seed:seedContent '{"ownerEmail":"rahmanef63@gmail.com","tenantSlug":"belajar-ai"}'
//
// Idempotent per course: a course whose slug already exists is skipped whole
// (its modules/lessons/quiz are assumed already seeded), so re-running is safe.

type SeedLesson = { title: string; contentMd: string; links?: { label: string; url: string }[] };
type SeedQuiz = {
  title: string;
  passingScorePct: number;
  questions: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[];
};
type SeedModule = { title: string; lessons: SeedLesson[]; quiz?: SeedQuiz };
type SeedCourse = { slug: string; title: string; description: string; modules: SeedModule[] };

const SEED_COURSES: SeedCourse[] = [
  {
    slug: "dasar-ai",
    title: "Dasar AI untuk Semua",
    description:
      "Pahami AI, machine learning, dan LLM dari nol — tanpa jargon, langsung ke praktik sehari-hari.",
    modules: [
      {
        title: "Mengenal AI & LLM",
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
        ],
        quiz: {
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
      },
      {
        title: "Pakai AI Sehari-hari",
        lessons: [
          {
            title: "Alat AI populer & kegunaannya",
            contentMd: `## Peta alat

- **Chat / asisten** — Claude, ChatGPT: menulis, meringkas, brainstorming, analisis.
- **Gambar** — Midjourney, DALL·E: ilustrasi & konsep visual.
- **Kode** — Claude Code, Copilot: membantu ngoding.

## Tips memilih

Cocokkan alat dengan tugasnya. Untuk teks & analisis, asisten chat sudah sangat kuat dan jadi titik awal terbaik.`,
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
        ],
      },
    ],
  },
  {
    slug: "prompt-engineering",
    title: "Prompt Engineering Praktis",
    description: "Teknik menyusun prompt agar AI memberi jawaban akurat, konsisten, dan sesuai kebutuhan.",
    modules: [
      {
        title: "Anatomi Prompt yang Baik",
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
        ],
      },
      {
        title: "Pola Lanjutan",
        lessons: [
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
        ],
        quiz: {
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
      },
    ],
  },
];

export const seedContent = internalMutation({
  args: { ownerEmail: v.string(), tenantSlug: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.ownerEmail))
      .unique();
    if (user === null) {
      throw new Error(`No user with email ${args.ownerEmail} — run seed:bootstrap first.`);
    }
    const tenant = await ctx.db
      .query("tenants")
      .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
      .unique();
    if (tenant === null) {
      throw new Error(`No tenant "${args.tenantSlug}" — run seed:bootstrap first.`);
    }
    const tenantId = tenant._id;
    const createdBy = user._id;
    const made = { courses: 0, modules: 0, lessons: 0, quizzes: 0, announcements: 0, skipped: 0 };

    for (const c of SEED_COURSES) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", c.slug))
        .unique();
      if (existing !== null) {
        made.skipped++;
        continue; // idempotent: course already seeded, leave it (and its children) alone
      }
      const courseId = await ctx.db.insert("courses", {
        tenantId,
        slug: c.slug,
        title: c.title,
        description: c.description,
        status: "published",
        createdBy,
      });
      made.courses++;

      for (let mi = 0; mi < c.modules.length; mi++) {
        const m = c.modules[mi];
        const moduleId = await ctx.db.insert("modules", {
          tenantId,
          courseId,
          title: m.title,
          order: mi,
        });
        made.modules++;

        for (let li = 0; li < m.lessons.length; li++) {
          const l = m.lessons[li];
          await ctx.db.insert("lessons", {
            tenantId,
            courseId,
            moduleId,
            title: l.title,
            contentMd: l.contentMd,
            links: l.links ?? [],
            order: li,
          });
          made.lessons++;
        }

        if (m.quiz) {
          await ctx.db.insert("quizzes", {
            tenantId,
            courseId,
            moduleId,
            title: m.quiz.title,
            passingScorePct: m.quiz.passingScorePct,
            questions: m.quiz.questions.map((q) => ({
              prompt: q.prompt,
              options: q.options,
              correctIndex: q.correctIndex,
              ...(q.explanation ? { explanation: q.explanation } : {}),
            })),
          });
          made.quizzes++;
        }
      }
    }

    // Welcome announcement (idempotent by title).
    const WELCOME_TITLE = "Selamat datang di Belajar AI! 🎉";
    const existingAnn = await ctx.db
      .query("announcements")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect();
    if (!existingAnn.some((a) => a.title === WELCOME_TITLE)) {
      await ctx.db.insert("announcements", {
        tenantId,
        title: WELCOME_TITLE,
        bodyMd: `Komunitas ini baru dibuka 🌱 Sudah ada **2 kelas** untuk mulai:

- **Dasar AI untuk Semua** — kenali AI, ML, dan LLM dari nol.
- **Prompt Engineering Praktis** — susun prompt yang akurat & konsisten.

Buka tab **Kelas**, pilih satu, dan catat progresmu. Selamat belajar — bareng-bareng!`,
        createdBy,
        postedToDiscord: false,
      });
      made.announcements++;
    }

    return { note: "content seed complete (idempotent)", ...made };
  },
});

// ── world seed: MORE communities (STATUS: "seed more data") ──────────────────
// Adds extra communities (each owned by the same owner) with covers + courses +
// a welcome post + a couple of approved resources, and back-fills a cover on the
// flagship. Internal-only; run AFTER seed:bootstrap + seed:seedContent:
//
//   npx convex run seed:seedWorld '{"ownerEmail":"rahmanef63@gmail.com"}'
//
// Idempotent: tenants by slug, courses by slug, announcements/resources by title.

type SeedCommunity = {
  slug: string;
  name: string;
  description: string;
  track?: string;
  coverImageUrl?: string;
  courses: SeedCourse[];
  announcement: { title: string; bodyMd: string };
  resources?: { title: string; url: string; note?: string }[];
};

const EXTRA_COMMUNITIES: SeedCommunity[] = [
  {
    slug: "karier-digital",
    name: "Karier Digital bareng Rahman",
    description:
      "Bangun karier digital dari nol — portofolio, freelance, dan skill yang dicari pasar. Berbahasa Indonesia.",
    track: "kerja",
    coverImageUrl: "https://picsum.photos/seed/karier-digital/1200/400",
    courses: [
      {
        slug: "portofolio-dilirik",
        title: "Portofolio yang Dilirik",
        description: "Susun portofolio yang bikin recruiter & klien berhenti scroll.",
        modules: [
          {
            title: "Fondasi Portofolio",
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
            ],
            quiz: {
              title: "Kuis: Portofolio",
              passingScorePct: 60,
              questions: [
                { prompt: "Portofolio unggul dari CV karena…", options: ["Lebih panjang", "Menunjukkan bukti nyata", "Lebih formal", "Wajib PDF"], correctIndex: 1 },
                { prompt: "Idealnya portofolio berisi…", options: ["Sebanyak mungkin proyek", "3 proyek fokus & dalam", "Hanya sertifikat", "Screenshot acak"], correctIndex: 1 },
                { prompt: "Tiap proyek sebaiknya menampilkan…", options: ["Harga jasa", "Masalah → aksi → hasil", "Riwayat pendidikan", "Hobi"], correctIndex: 1 },
              ],
            },
          },
        ],
      },
      {
        slug: "freelance-nol",
        title: "Freelance dari Nol",
        description: "Dapat klien pertama tanpa koneksi orang dalam.",
        modules: [
          {
            title: "Mulai Freelance",
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
            ],
            quiz: {
              title: "Kuis: Freelance",
              passingScorePct: 60,
              questions: [
                { prompt: "Kenapa memilih niche?", options: ["Biar sempit", "Biar mudah dibedakan & direkomendasikan", "Biar mahal", "Karena wajib"], correctIndex: 1 },
                { prompt: "Sumber klien pertama dengan konversi tertinggi biasanya…", options: ["Iklan berbayar", "Jaringan terdekat", "Cold email massal", "SEO"], correctIndex: 1 },
                { prompt: "Tawaran yang kuat menekankan…", options: ["Fitur jasa", "Hasil untuk klien", "Harga termurah", "Portofolio panjang"], correctIndex: 1 },
              ],
            },
          },
        ],
      },
    ],
    announcement: {
      title: "Selamat datang di Karier Digital! 💼",
      bodyMd: `Komunitas ini fokus ke **karier digital yang nyata**. Mulai dari dua kelas:

- **Portofolio yang Dilirik** — bukti > klaim.
- **Freelance dari Nol** — dapat klien pertama.

Buka tab **Kelas** dan kerjakan langkah demi langkah.`,
    },
    resources: [
      { title: "Template studi kasus portofolio", url: "https://www.notion.so", note: "Kerangka before → after untuk tiap proyek." },
    ],
  },
  {
    slug: "kreator-konten",
    name: "Kreator Konten AI",
    description:
      "Bikin konten konsisten pakai bantuan AI — ide, skrip, dan caption tanpa buntu.",
    track: "konten",
    coverImageUrl: "https://picsum.photos/seed/kreator-konten/1200/400",
    courses: [
      {
        slug: "ide-konten",
        title: "Ide Konten Tanpa Buntu",
        description: "Sistem sederhana biar nggak pernah kehabisan ide.",
        modules: [
          {
            title: "Sistem Ide",
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
            ],
            quiz: {
              title: "Kuis: Ide Konten",
              passingScorePct: 60,
              questions: [
                { prompt: "Prompt ide yang baik memberi AI…", options: ["Satu kata", "Konteks: audiens/niche/tujuan", "Hanya emoji", "Tanpa arahan"], correctIndex: 1 },
                { prompt: "Cara menjaga konsistensi konten?", options: ["Bikin harian dadakan", "Batch & pakai pilar konten", "Tunggu mood", "Hanya pas viral"], correctIndex: 1 },
              ],
            },
          },
        ],
      },
      {
        slug: "skrip-caption",
        title: "Skrip & Caption Cepat",
        description: "Nulis hook & caption yang ngajak aksi, cepat.",
        modules: [
          {
            title: "Nulis Cepat",
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
            ],
            quiz: {
              title: "Kuis: Skrip & Caption",
              passingScorePct: 60,
              questions: [
                { prompt: "Hook yang kuat berisi…", options: ["Salam panjang", "Janji + rasa penasaran", "Deretan hashtag", "Tag teman"], correctIndex: 1 },
                { prompt: "Caption sebaiknya punya berapa CTA utama?", options: ["Sebanyak mungkin", "Satu", "Nol", "Lima"], correctIndex: 1 },
              ],
            },
          },
        ],
      },
    ],
    announcement: {
      title: "Selamat datang di Kreator Konten AI! 🎬",
      bodyMd: `Buat kamu yang bikin konten: **ide, skrip, caption** jadi lebih cepat dengan AI.

- **Ide Konten Tanpa Buntu** — sistem ide 30 hari.
- **Skrip & Caption Cepat** — hook & CTA yang bekerja.

Selamat berkarya!`,
    },
    resources: [
      { title: "Bank hook siap pakai", url: "https://claude.ai", note: "Minta variasi hook ke Claude pakai konteksmu." },
    ],
  },
];

export const seedWorld = internalMutation({
  args: { ownerEmail: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.ownerEmail))
      .unique();
    if (user === null) {
      throw new Error(`No user with email ${args.ownerEmail} — run seed:bootstrap first.`);
    }
    const createdBy = user._id;
    const made = { tenants: 0, courses: 0, modules: 0, lessons: 0, quizzes: 0, announcements: 0, resources: 0, covers: 0 };

    // Seed a course tree into a tenant (idempotent by course slug).
    async function seedCourse(tenantId: Id<"tenants">, c: SeedCourse) {
      const existing = await ctx.db
        .query("courses")
        .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", c.slug))
        .unique();
      if (existing !== null) return;
      const courseId = await ctx.db.insert("courses", {
        tenantId, slug: c.slug, title: c.title, description: c.description, status: "published", createdBy,
      });
      made.courses++;
      for (let mi = 0; mi < c.modules.length; mi++) {
        const m = c.modules[mi];
        const moduleId = await ctx.db.insert("modules", { tenantId, courseId, title: m.title, order: mi });
        made.modules++;
        for (let li = 0; li < m.lessons.length; li++) {
          const l = m.lessons[li];
          await ctx.db.insert("lessons", {
            tenantId, courseId, moduleId, title: l.title, contentMd: l.contentMd, links: l.links ?? [], order: li,
          });
          made.lessons++;
        }
        if (m.quiz) {
          await ctx.db.insert("quizzes", {
            tenantId, courseId, moduleId, title: m.quiz.title, passingScorePct: m.quiz.passingScorePct,
            questions: m.quiz.questions.map((q) => ({
              prompt: q.prompt, options: q.options, correctIndex: q.correctIndex,
              ...(q.explanation ? { explanation: q.explanation } : {}),
            })),
          });
          made.quizzes++;
        }
      }
    }

    // Back-fill a cover on the flagship community if it has none.
    const flagship = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", "belajar-ai")).unique();
    if (flagship && !flagship.coverImageUrl) {
      await ctx.db.patch(flagship._id, { coverImageUrl: "https://picsum.photos/seed/belajar-ai/1200/400" });
      made.covers++;
    }

    for (const co of EXTRA_COMMUNITIES) {
      let tenant = await ctx.db.query("tenants").withIndex("by_slug", (q) => q.eq("slug", co.slug)).unique();
      if (tenant === null) {
        const newId = await ctx.db.insert("tenants", {
          slug: co.slug, name: co.name, description: co.description, status: "active", ownerId: createdBy,
          ...(co.track ? { track: co.track } : {}),
          ...(co.coverImageUrl ? { coverImageUrl: co.coverImageUrl } : {}),
        });
        await ctx.db.insert("memberships", { tenantId: newId, userId: createdBy, role: "owner" });
        tenant = await ctx.db.get(newId);
        made.tenants++;
      } else if (!tenant.coverImageUrl && co.coverImageUrl) {
        await ctx.db.patch(tenant._id, { coverImageUrl: co.coverImageUrl });
        made.covers++;
      }
      if (tenant === null) continue;
      const tenantId = tenant._id;

      for (const c of co.courses) await seedCourse(tenantId, c);

      const anns = await ctx.db.query("announcements").withIndex("by_tenant", (q) => q.eq("tenantId", tenantId)).collect();
      if (!anns.some((a) => a.title === co.announcement.title)) {
        await ctx.db.insert("announcements", {
          tenantId, title: co.announcement.title, bodyMd: co.announcement.bodyMd, createdBy, postedToDiscord: false,
        });
        made.announcements++;
      }

      const approved = await ctx.db
        .query("resources")
        .withIndex("by_tenant_status", (q) => q.eq("tenantId", tenantId).eq("status", "approved"))
        .collect();
      for (const r of co.resources ?? []) {
        if (!approved.some((x) => x.title === r.title)) {
          await ctx.db.insert("resources", {
            tenantId, title: r.title, url: r.url, ...(r.note ? { note: r.note } : {}), submittedBy: createdBy, status: "approved",
          });
          made.resources++;
        }
      }
    }

    return { note: "world seed complete (idempotent)", ...made };
  },
});
