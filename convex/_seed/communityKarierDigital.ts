// Extra community: "Karier Digital bareng Rahman" — its own courses, welcome
// post and curated links. One community per file, same reasoning as the
// per-course split.
//
// Each course is a FLAT list of materi (DECISIONS #37) — module headings
// dropped, one quiz per course.
//
// The two curricula moved OUT to `karierPortofolioData.ts` and
// `karierFreelanceData.ts` when they grew from 2 to 10 materi each: long
// Bahasa-Indonesia course copy is only exempt from the 200-LOC ceiling under
// the `convex/_seed/*Data.ts` glob (docs/rr-conventions.md, "File modularity").
// The community stays what it always was — the assembly point for its courses,
// its welcome post and its links.
import type { SeedCommunity } from "./types";
import { KARIER_FREELANCE_CURRICULUM } from "./karierFreelanceData";
import { KARIER_PORTOFOLIO_CURRICULUM } from "./karierPortofolioData";

export const COMMUNITY_KARIER_DIGITAL: SeedCommunity = {
  slug: "karier-digital",
  name: "Karier Digital bareng Rahman",
  description:
    "Bangun karier digital dari nol — portofolio, freelance, dan skill yang dicari pasar. Berbahasa Indonesia.",
  track: "kerja",
  courses: [KARIER_PORTOFOLIO_CURRICULUM, KARIER_FREELANCE_CURRICULUM],
  welcome: {
    title: "Selamat datang di Karier Digital! 💼",
    bodyMd: `Komunitas ini fokus ke **karier digital yang nyata**. Mulai dari dua kelas:

- **Portofolio yang Dilirik** — bukti > klaim.
- **Freelance dari Nol** — dapat klien pertama.

Buka tab **Kelas** dan kerjakan langkah demi langkah.`,
  },
  sumber: [
    { title: "Template studi kasus portofolio", url: "https://www.notion.so", note: "Kerangka before → after untuk tiap proyek." },
  ],
};
