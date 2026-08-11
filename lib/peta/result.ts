// Peta Belajar — the OUTPUT half of the type contract. Split from types.ts to
// stay under the 200-LOC ceiling (AGENTS.md §5.4); both halves are re-exported
// from the barrel, so a consumer never imports either file directly.
//
// Nothing here knows about routes. `CourseRef` and `MateriRef` carry slugs, and
// `lib/community.ts` turns slugs into hrefs — one place owns the URL shape.
import type { ConceptId, ConceptTier } from "./types";

export type Level = "pemula" | "terbiasa" | "menengah" | "lanjut";

/** A course, addressed the way the router wants it. No hrefs here: building
 *  URLs is `lib/community.ts`'s job and this file must not learn about routes. */
export type CourseRef = { communitySlug: string; courseSlug: string; title: string };

/** A single materi permalink target (`/k/<community>/materi/<materiSlug>`). */
export type MateriRef = { communitySlug: string; materiSlug: string; title: string; courseSlug: string };

export type PathId =
  | "fondasi"
  | "produktivitas-kerja"
  | "prompt-andalan"
  | "olah-data"
  | "bikin-aplikasi"
  | "multi-agent"
  | "kreator-konten"
  | "karier-digital";

/** One ranked recommendation. Two or three of these come back, never fewer. */
export type RankedPath = {
  id: PathId;
  title: string;
  summary: string;
  communitySlug: string;
  /** Teaching order, not catalogue order. */
  courses: readonly CourseRef[];
  /** 0–100, monotonic within one result; comparable across results only loosely. */
  score: number;
  /** Second person, cites their own answers. */
  reason: string;
  /** Exactly three. Concrete enough to do tonight. */
  thisWeek: readonly [string, string, string];
};

export type BudgetAdvice = {
  /** One line. Rp0 runs say so outright. */
  headline: string;
  /** Free tiers worth using, with the limit that actually bites. */
  free: readonly string[];
  /** What is worth paying for. EMPTY when the plan is free. */
  paid: readonly string[];
  /** Money they can stop spending. Telling someone to stop paying is worth
   *  more than any upsell, so this is a first-class field, not a footnote. */
  savings: readonly string[];
  /** Subscriptions they already pay for, and what to actually do with them. */
  useWhatYouPayFor: readonly string[];
};

/** A concept they did not know, and where to close it. */
export type KnowledgeGap = {
  concept: ConceptId;
  tier: ConceptTier;
  title: string;
  /** Second person: why closing this one matters to THEM. */
  why: string;
  /** `null` = the platform does not teach it yet. Honest beats a wrong link,
   *  and the null list is the owner's content backlog. */
  materi: MateriRef | null;
};

export type PetaResult = {
  level: Level;
  /** "Pemula" | "Terbiasa" | "Menengah" | "Lanjut". */
  levelLabel: string;
  /** Second person, cites tenure AND what they did or did not know. */
  levelReason: string;
  /** One-line headline for the result screen. */
  headline: string;
  /** 2 or 3, ranked, best first. Never empty. */
  paths: readonly RankedPath[];
  budget: BudgetAdvice;
  /** Up to four, materi-backed ones first. May be empty (they knew it all). */
  gaps: readonly KnowledgeGap[];
};
