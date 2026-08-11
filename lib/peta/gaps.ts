// Gaps: the concepts they were ASKED about and did not know, ordered by what
// is worth closing FIRST and capped at four.
//
// Order: tier ascending (a missing "halusinasi" outranks a missing "MCP" every
// time), then materi-backed before untaught, then deck order. Capping at four
// is a product decision — a result screen listing nine things you do not know
// is a demotivation machine, and the fifth item is never the one that moves.
import { CONCEPTS, CONCEPT_MATERI, CONCEPT_WHY } from "./concepts";
import { conceptsFor } from "./questions";
import type { ConceptTier, PetaAnswers } from "./types";
import type { KnowledgeGap } from "./result";

const TIER_ORDER: Record<ConceptTier, number> = { dasar: 0, menengah: 1, lanjut: 2 };
const DECK_INDEX = new Map(CONCEPTS.map((card, i) => [card.id, i]));

/** How many gaps a result screen shows. Four fits a 390px viewport unscrolled. */
export const MAX_GAPS = 4;

export function gapsFor(answers: PetaAnswers): readonly KnowledgeGap[] {
  const knownSet = new Set(answers.known);
  return conceptsFor(answers)
    .filter((card) => !knownSet.has(card.id))
    .map((card) => ({
      concept: card.id,
      tier: card.tier,
      title: card.title,
      why: CONCEPT_WHY[card.id],
      materi: CONCEPT_MATERI[card.id],
    }))
    .sort((a, b) => {
      const tier = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      if (tier !== 0) return tier;
      const taught = Number(b.materi !== null) - Number(a.materi !== null);
      if (taught !== 0) return taught;
      return (DECK_INDEX.get(a.concept) ?? 0) - (DECK_INDEX.get(b.concept) ?? 0);
    })
    .slice(0, MAX_GAPS);
}
