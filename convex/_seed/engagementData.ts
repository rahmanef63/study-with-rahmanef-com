// Community life for the flagship (seed:seedEngagement): starter members, the
// Diskusi feed rows across all four kinds, and starter lesson threads.
// Content only; the rules live in convex/_seed/engagement.ts.
import type { SeedFeedPost, SeedMember, SeedResource, SeedThread } from "./types";

// Starter community members. Owner ("rahman") is added to the author map at
// runtime; these three give the boards a human, non-owner voice.
export const SEED_MEMBERS: SeedMember[] = [
  { email: "sari.seed@belajar-ai.local", username: "sari", displayName: "Sari Wulandari", bio: "Ibu rumah tangga, lagi belajar pakai AI buat bantu usaha kecil." },
  { email: "budi.seed@belajar-ai.local", username: "budi", displayName: "Budi Santoso", bio: "Fresh grad yang lagi banting setir ke dunia digital." },
  { email: "dewi.seed@belajar-ai.local", username: "dewi_a", displayName: "Dewi Anjani", bio: "Freelance content creator, mau kerja lebih cepat pakai AI." },
];

export const SEED_RESOURCES: SeedResource[] = [
  { title: "Claude (Anthropic)", url: "https://claude.ai", note: `Asisten AI dari Anthropic dengan paket gratis; enak buat ngobrol, menulis, dan merapikan pekerjaan sehari-hari dalam bahasa Indonesia.` },
  { title: "ChatGPT (OpenAI)", url: "https://chatgpt.com", note: `Chatbot AI populer yang bisa dipakai gratis untuk tanya-jawab, bikin draf tulisan, sampai cari ide jualan.` },
  { title: "Google Gemini", url: "https://gemini.google.com", note: `AI gratis dari Google yang terhubung dengan Search; cocok buat cari info dan bantuan tugas cepat.` },
  { title: "Pengantar AI Generatif — Google (Bahasa Indonesia)", url: "https://www.coursera.org/learn/introduction-to-generative-ai---bahasa-indonesia", note: `Kelas pengantar AI dari Google, full bahasa Indonesia dan bisa diikuti gratis, pas banget buat pemula total.` },
  { title: "Elements of AI", url: "https://www.elementsofai.com/", note: `Kursus online gratis dari Universitas Helsinki yang menjelaskan apa itu AI tanpa rumus, ramah untuk yang bukan orang teknis (bahasa Inggris).` },
  { title: "3Blue1Brown — Neural Networks (YouTube)", url: "https://www.youtube.com/@3blue1brown", note: `Channel YouTube gratis dengan seri 'Neural Networks' yang menjelaskan cara AI 'berpikir' lewat animasi yang gampang dicerna.` },
  { title: "Panduan Prompt Engineering — Anthropic", url: "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview", note: `Dokumentasi resmi Anthropic soal cara menyusun prompt yang jelas dan efektif; rujukan utama saat mendalami teknik prompting.` },
  { title: "Tutorial Interaktif Prompt Engineering — Anthropic", url: "https://github.com/anthropics/prompt-eng-interactive-tutorial", note: `Tutorial interaktif gratis 9 bab dari Anthropic: dari struktur prompt, pakai contoh (few-shot), sampai menghindari halusinasi.` },
  { title: "Learn Prompting", url: "https://learnprompting.org/", note: `Panduan prompt engineering gratis dan terstruktur untuk pemula, dari dasar sampai teknik lanjutan seperti chain-of-thought.` },
];

export const SEED_THREADS: SeedThread[] = [
  {
    courseSlug: "dasar-ai",
    root: { author: "sari", bodyMd: `Maaf nanya polos ya 🙏 Saya cuma jualan online kecil-kecilan dari rumah. Buat mulai pakai AI, apa saya harus bisa **coding** dulu? Takutnya kadung ribet duluan.` },
    reply: { author: "rahman", bodyMd: `Sama sekali nggak perlu coding kok, Bu Sari 🙂 AI sekarang dipakainya lewat **ngobrol pakai bahasa biasa**, persis kayak chat WA. Ibu tinggal ketik apa yang diinginkan, nanti kita latihan pelan-pelan bareng.` },
  },
  {
    courseSlug: "dasar-ai",
    root: { author: "budi", bodyMd: `Aku masih bingung bedanya **AI, Machine Learning, sama LLM**. Ini tiga hal beda, atau kayak lingkaran di dalam lingkaran gitu?` },
    reply: { author: "rahman", bodyMd: `Tebakanmu udah pas, Budi 👍 Anggap **AI** payung besarnya, **Machine Learning** salah satu cara bikin AI belajar dari data, dan **LLM** (kayak ChatGPT) jenis ML yang khusus jago olah bahasa. Jadi memang lingkaran di dalam lingkaran, nggak usah overthinking dulu ya.` },
  },
  {
    courseSlug: "dasar-ai",
    root: { author: "dewi_a", bodyMd: `Alat AI sekarang banyak banget: ChatGPT, Gemini, Claude, dll. Buat mulai belajar mending fokus satu dulu atau coba semua sekalian?` },
    reply: { author: "budi", bodyMd: `Aku kemarin mulai dari satu tool aja, dan bener sih jadi nggak kebanyakan mikir. Pas udah lumayan lancar, nyoba yang lain malah gampang. Fokus satu dulu deh, Dewi 😄` },
  },
  {
    courseSlug: "prompt-engineering",
    root: { author: "sari", bodyMd: `Saya coba minta AI bikin caption jualan, tapi hasilnya kaku dan lebay 😅 Padahal produk saya cuma **keripik pisang** rumahan. Salah saya di mana ya?` },
    reply: { author: "rahman", bodyMd: `Biasanya karena promptnya masih terlalu umum, Bu 🙂 Coba kasih **konteks + gaya bahasa**, misal: *"Buatkan caption singkat, santai, bahasa sehari-hari untuk keripik pisang buatan rumah, target ibu-ibu, ada ajakan beli."* Makin jelas konteksnya, makin pas hasilnya.` },
  },
  {
    courseSlug: "prompt-engineering",
    root: { author: "budi", bodyMd: `Kemarin aku tanya data ke AI, dijawab yakin banget tapi ternyata **salah/ngarang**. Ini yang namanya halusinasi ya? Cara ngindarinnya gimana?` },
    reply: { author: "rahman", bodyMd: `Betul, itu **halusinasi** 👍 AI kadang 'pede' walau keliru. Triknya: minta dia sebutkan sumber, jangan andalkan buat angka/fakta penting tanpa dicek ulang, dan pancing dengan *"kalau nggak tahu, bilang tidak tahu"*. Kita kupas tuntas di materi ini.` },
  },
  {
    courseSlug: "prompt-engineering",
    root: { author: "dewi_a", bodyMd: `Aku pengin hasil AI konsisten sesuai **gaya tulisanku** biar nggak edit banyak tiap kali. Ada cara selain jelasin panjang lebar terus-terusan?` },
    reply: { author: "rahman", bodyMd: `Ada, namanya **few-shot**, Dewi 🙌 Kasih 2-3 contoh tulisan gaya kamu di dalam prompt, terus minta *"tiru gaya di atas"*. AI jauh lebih nurut belajar dari contoh ketimbang dijelasin panjang. Simpan contoh favoritmu biar tinggal tempel.` },
  },
];

// Usulan kelas berikutnya. The open/planned/done status is GONE (#33): a usulan
// is just a post, and its likes are the only signal of demand.
export const SEED_USULAN: SeedFeedPost[] = [
  { title: "Bikin chatbot WhatsApp sederhana pakai AI", author: "budi", likedBy: ["rahman", "sari", "budi", "dewi_a"], bodyMd: `Banyak yang pengen balas chat pelanggan otomatis tanpa harus ngoding. Kayaknya pas banget jadi kelas lanjutan setelah Prompt Engineering.` },
  { title: "AI untuk bikin konten & caption jualan olshop", author: "sari", likedBy: ["sari", "budi", "dewi_a"], bodyMd: `Bantu nulis deskripsi produk dan caption promo yang menarik biar dagangan di warung sama olshop makin dilirik.` },
  { title: "Bikin gambar produk & template feed pakai AI", author: "dewi_a", likedBy: ["dewi_a", "sari"], bodyMd: `Foto produk seadanya bisa jadi rapi, plus bikin template feed Instagram tanpa perlu jago desain.` },
  { title: "Keamanan & privasi: data apa yang aman dikasih ke AI", author: "budi", likedBy: ["rahman", "budi", "dewi_a"], bodyMd: `Mana yang boleh dan yang jangan sampai dishare ke chatbot — kayaknya perlu dibahas khusus, bukan cuma sambil lalu.` },
  { title: "AI untuk guru: bikin soal, RPP, dan materi ajar", author: "budi", likedBy: ["rahman", "budi"], bodyMd: `Beberapa guru di grup pengen mempersingkat waktu nyiapin bahan ngajar tiap minggu.` },
  { title: "AI bantu catat pemasukan & stok warung", author: "sari", likedBy: ["sari", "budi"], bodyMd: `Rekap penjualan harian dan ingatkan stok yang mau habis lewat obrolan sederhana.` },
  { title: "Ngobrol & tanya AI pakai suara (bahasa Indonesia)", author: "sari", likedBy: ["sari"], bodyMd: `Buat yang kurang nyaman ngetik, biar bisa tanya AI sambil ngerjain hal lain di rumah.` },
];

// Obrolan bebas — the DEFAULT kind. Without these the Diskusi feed opens on a
// board where nobody has simply talked to anybody.
// SEED_DISKUSI was removed 2026-08-09. It seeded two synthetic "warga bertanya"
// posts so the Diskusi chip would not open empty — but the owner does not want
// invented conversation in a real community, and an empty chip on a young
// community is the honest state, not a bug. The two rows it had already written
// to production were deleted by features/posts/dropSeedDiskusi.ts.
