// The adaptive question feed. Pure: the whole run is a function of the draft,
// so a UI can re-derive "what do I ask next" after a back-navigation without
// keeping its own state machine, and the test can count questions per persona.
import {
  BUDGET_OPTIONS,
  GOAL_OPTIONS,
  ROLE_OPTIONS,
  SUBSCRIPTION_OPTIONS,
  TENURE_OPTIONS,
  WEEKLY_TIME_OPTIONS,
} from "./options";
import { CONCEPTS } from "./concepts";
import type {
  ConceptCard,
  PetaAnswers,
  PetaDraft,
  PetaQuestion,
  SingleChoiceQuestion,
  SituationAnswers,
} from "./types";

const STAGE1: readonly SingleChoiceQuestion[] = [
  {
    kind: "pilih-satu",
    id: "tenure",
    stage: "kenalan",
    prompt: "Sudah berapa lama kamu pakai AI?",
    help: "Jawaban ini menentukan seberapa dalam kami bertanya nanti.",
    options: TENURE_OPTIONS,
  },
  { kind: "pilih-satu", id: "role", stage: "kenalan", prompt: "Sehari-hari kamu ngapain?", options: ROLE_OPTIONS },
  {
    kind: "pilih-satu",
    id: "goal",
    stage: "kenalan",
    prompt: "Kalau AI benar-benar membantumu, yang pertama berubah apa?",
    options: GOAL_OPTIONS,
  },
];

const STAGE2_BUDGET: SingleChoiceQuestion = {
  kind: "pilih-satu",
  id: "budget",
  stage: "modal",
  prompt: "Berapa yang siap kamu keluarkan tiap bulan untuk AI?",
  help: "Rp0 itu jawaban yang sah — rencananya tetap kami buat penuh.",
  options: BUDGET_OPTIONS,
};

const STAGE2_TIME: SingleChoiceQuestion = {
  kind: "pilih-satu",
  id: "weeklyTime",
  stage: "modal",
  prompt: "Realistisnya, berapa jam per minggu buat belajar?",
  help: "Jawab jujur. Rencana yang kekecilan selesai; yang kebesaran ditinggalkan.",
  options: WEEKLY_TIME_OPTIONS,
};

const STAGE4: readonly (SingleChoiceQuestion & { id: keyof SituationAnswers })[] = [
  {
    kind: "pilih-satu",
    id: "codingWithAi",
    stage: "situasi",
    prompt: "Kamu sudah ngoding bareng AI?",
    options: [
      { value: "routinely", label: "Rutin, tiap hari" },
      { value: "sometimes", label: "Kadang-kadang" },
      { value: "not-yet", label: "Belum" },
    ],
  },
  {
    kind: "pilih-satu",
    id: "spreadsheetComfort",
    stage: "situasi",
    prompt: "Nyaman pakai spreadsheet?",
    options: [
      { value: "yes", label: "Nyaman, sampai rumus" },
      { value: "somewhat", label: "Bisa yang dasar" },
      { value: "no", label: "Belum" },
    ],
  },
  {
    kind: "pilih-satu",
    id: "hasChannel",
    stage: "situasi",
    prompt: "Sudah punya akun atau kanal tempat kamu posting?",
    options: [
      { value: "active", label: "Ada dan aktif" },
      { value: "dormant", label: "Ada tapi jarang diisi" },
      { value: "none", label: "Belum ada" },
    ],
  },
  {
    kind: "pilih-satu",
    id: "spendPriority",
    stage: "situasi",
    prompt: "Kalau nanti ada tool berbayar yang kami sarankan, kamu maunya?",
    options: [
      { value: "best-result", label: "Yang hasilnya paling bagus" },
      { value: "cheapest", label: "Yang sehemat mungkin" },
      { value: "unsure", label: "Belum tahu, sarankan saja" },
    ],
  },
];

/**
 * The swipe deck for this draft. THE adaptation: basics for everyone, the
 * intermediate tier only from 3 months in, the advanced tier only past a year
 * or for developers. A missing `tenure` yields the shortest safe deck.
 */
export function conceptsFor(draft: PetaDraft): readonly ConceptCard[] {
  const rank = draft.tenure === "over1y" ? 3 : draft.tenure === "3to12m" ? 2 : draft.tenure === "under3m" ? 1 : 0;
  // A self-declared beginner who is a DEVELOPER still needs the middle rung: the
  // override used to open `lanjut` alone, so "belum pernah pakai AI" + "developer"
  // produced a deck that jumped Dasar -> RAG/MCP/fine-tuning and skipped few-shot
  // entirely. That reads as a broken quiz, not a deliberate branch.
  const menengah = rank >= 2 || draft.role === "developer";
  const lanjut = rank >= 3 || draft.role === "developer";
  return CONCEPTS.filter(
    (c) => c.tier === "dasar" || (c.tier === "menengah" && menengah) || (c.tier === "lanjut" && lanjut),
  );
}

/** Which stage-4 branches are open. Rp0 closes the spend question outright. */
export function situationFieldsFor(draft: PetaDraft): readonly (keyof SituationAnswers)[] {
  const open: (keyof SituationAnswers)[] = [];
  if (draft.role === "developer") open.push("codingWithAi");
  if (draft.goal === "work-with-data" || draft.role === "analyst") open.push("spreadsheetComfort");
  if (draft.goal === "make-content" || draft.role === "marketing") open.push("hasChannel");
  if (draft.budget !== undefined && draft.budget !== "zero") open.push("spendPriority");
  return open;
}

/** Every question this draft still implies, in asking order. */
export function questionsFor(draft: PetaDraft): readonly PetaQuestion[] {
  const open = new Set(situationFieldsFor(draft));
  return [
    ...STAGE1,
    STAGE2_BUDGET,
    {
      kind: "pilih-banyak",
      id: "subscriptions",
      stage: "modal",
      prompt: "Sudah langganan yang mana?",
      help: "Boleh pilih lebih dari satu.",
      exclusive: "none",
      options: SUBSCRIPTION_OPTIONS,
    },
    STAGE2_TIME,
    {
      kind: "geser",
      id: "known",
      stage: "pengetahuan",
      prompt: "Geser kanan kalau kamu tahu, kiri kalau belum.",
      help: "Tidak ada nilai. Ini cuma supaya kami tidak mengajarimu yang sudah kamu kuasai.",
      cards: conceptsFor(draft),
    },
    ...STAGE4.filter((q) => open.has(q.id)),
  ];
}

function isAnswered(draft: PetaDraft, q: PetaQuestion): boolean {
  if (q.kind === "geser") return draft.known !== undefined;
  if (q.kind === "pilih-banyak") return draft.subscriptions !== undefined;
  switch (q.id) {
    case "tenure":
      return draft.tenure !== undefined;
    case "role":
      return draft.role !== undefined;
    case "goal":
      return draft.goal !== undefined;
    case "budget":
      return draft.budget !== undefined;
    case "weeklyTime":
      return draft.weeklyTime !== undefined;
    default:
      return draft.situation?.[q.id] !== undefined;
  }
}

/** The next thing to ask, or null when the run is complete. */
export function nextQuestion(draft: PetaDraft): PetaQuestion | null {
  for (const q of questionsFor(draft)) if (!isAnswered(draft, q)) return q;
  return null;
}

/** 0–1, for the progress bar. Denominator grows as the branch set is learnt. */
export function progress(draft: PetaDraft): number {
  const all = questionsFor(draft);
  const done = all.filter((q) => isAnswered(draft, q)).length;
  return all.length === 0 ? 1 : done / all.length;
}

export function isComplete(draft: PetaDraft): draft is PetaAnswers {
  return nextQuestion(draft) === null;
}
