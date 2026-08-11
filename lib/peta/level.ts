// Level: tenure AND the knowledge answers, together.
//
// The rule that matters: someone who has opened ChatGPT every day for a year
// but knows nothing past "prompt" is NOT Lanjut. Tenure alone can only carry
// you to Terbiasa; the two upper levels are gated on what the swipe deck says.
// Symmetrically, a developer who ticks every advanced card but has never used
// AI is capped at Menengah — claiming to know MCP is not the same as shipping.
import { TENURE_RANK } from "./options";
import { conceptsFor } from "./questions";
import type { ConceptTier, PetaAnswers } from "./types";
import type { Level } from "./result";

export const LEVEL_LABEL: Record<Level, string> = {
  pemula: "Pemula",
  terbiasa: "Terbiasa",
  menengah: "Menengah",
  lanjut: "Lanjut",
};

export type KnowledgeTally = {
  /** Per tier: how many cards were ASKED and how many they knew. */
  asked: Record<ConceptTier, number>;
  known: Record<ConceptTier, number>;
  /** Ids that were asked and NOT known — the raw material for the gap list. */
  missing: readonly string[];
};

/**
 * Count only what was ASKED. A `known` array carried over from a longer run
 * (they went back and changed tenure) must not inflate the score, which is why
 * this intersects with `conceptsFor` instead of trusting the array.
 */
export function tally(answers: PetaAnswers): KnowledgeTally {
  const deck = conceptsFor(answers);
  const knownSet = new Set(answers.known);
  const asked: Record<ConceptTier, number> = { dasar: 0, menengah: 0, lanjut: 0 };
  const known: Record<ConceptTier, number> = { dasar: 0, menengah: 0, lanjut: 0 };
  const missing: string[] = [];
  for (const card of deck) {
    asked[card.tier]++;
    if (knownSet.has(card.id)) known[card.tier]++;
    else missing.push(card.id);
  }
  return { asked, known, missing };
}

/**
 * Four levels, checked top-down. Every branch is reachable and the fall-through
 * is `pemula`, so this is total for any legal input.
 *
 * - lanjut   — 4+ advanced cards, a solid base, AND at least 3 months of real use.
 * - menengah — real depth past the basics (2+ intermediate or 2+ advanced) on a base of 3+.
 * - terbiasa — half the basics, OR 3+ months of use even if the cards went badly.
 * - pemula   — everything else. Not an insult: it is the shortest route in.
 */
export function levelOf(answers: PetaAnswers): Level {
  const t = tally(answers);
  const rank = TENURE_RANK[answers.tenure];
  if (t.known.lanjut >= 4 && t.known.dasar >= 3 && rank >= 2) return "lanjut";
  if ((t.known.menengah >= 2 || t.known.lanjut >= 2) && t.known.dasar >= 3) return "menengah";
  if (t.known.dasar >= 2 || rank >= 2) return "terbiasa";
  return "pemula";
}

const TENURE_CLAUSE: Record<PetaAnswers["tenure"], string> = {
  never: "Kamu belum pernah pakai AI",
  under3m: "Kamu baru beberapa minggu pakai AI",
  "3to12m": "Kamu sudah beberapa bulan pakai AI",
  over1y: "Kamu sudah lebih dari setahun pakai AI",
};

/** Second person, and it names the number of cards — no vague flattery. */
export function levelReason(answers: PetaAnswers): string {
  const t = tally(answers);
  const totalAsked = t.asked.dasar + t.asked.menengah + t.asked.lanjut;
  const totalKnown = t.known.dasar + t.known.menengah + t.known.lanjut;
  const head = TENURE_CLAUSE[answers.tenure];
  const cards = `kamu tahu ${totalKnown} dari ${totalAsked} istilah yang kami tanyakan`;

  const level = levelOf(answers);
  if (level === "lanjut") {
    return `${head}, dan ${cards} — termasuk ${t.known.lanjut} istilah tingkat lanjut. Kamu sudah lewat tahap belajar dasar.`;
  }
  if (level === "menengah") {
    return `${head}, dan ${cards}. Dasarnya kuat; yang kurang tinggal teknik yang bikin hasilnya konsisten.`;
  }
  if (level === "terbiasa") {
    if (TENURE_RANK[answers.tenure] >= 2 && t.known.dasar <= 2) {
      return `${head}, tapi ${cards}. Jam terbangmu banyak dan itu modal bagus — yang belum, kosakata dasarnya. Menutup itu biasanya butuh satu-dua minggu, bukan berbulan-bulan.`;
    }
    return `${head}, dan ${cards}. Kamu sudah paham dasarnya dan tinggal menaikkan tekniknya.`;
  }
  return `${head}, dan ${cards}. Kita mulai dari nol dengan urutan yang jelas — tidak ada yang perlu kamu kejar duluan.`;
}
