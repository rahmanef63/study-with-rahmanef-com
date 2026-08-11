// THE deliverable test. Two claims, both proved by enumeration rather than by
// argument:
//
//   1. TOTALITY + FLOOR — no combination of answers returns zero paths, throws,
//      or produces an undefined field. Every run gets 2 or 3 ranked paths.
//   2. REACHABILITY — every path in the catalogue is in somebody's top three.
//      A path nobody can ever be shown is dead weight pretending to be choice.
//
// The full answer space is infinite in principle (2^13 knowledge subsets × 2^5
// subscription sets × the single-choice cross product), so it is covered in two
// exhaustive sweeps that between them touch every dimension exhaustively:
//
//   Sweep A — the FULL single-choice cross product (tenure × role × goal ×
//             budget × time = 3,456), crossed with representative knowledge,
//             subscription and branch-answer profiles.
//   Sweep B — EVERY knowledge subset (2^13 = 8,192) against personas whose
//             stage-1 answers open all three tiers.
//
// Assertions are accumulated and asserted once at the end: `expect` inside a
// 150k-iteration loop costs more than the function under test.
import { describe, expect, it } from "vitest";
import {
  BUDGET_OPTIONS,
  CONCEPTS,
  GOAL_OPTIONS,
  PATHS,
  ROLE_OPTIONS,
  TENURE_OPTIONS,
  WEEKLY_TIME_OPTIONS,
  assess,
  conceptsFor,
  questionsFor,
} from "./index";
import type { ConceptId, PathId, PetaAnswers, SituationAnswers, Subscription } from "./index";

const CATALOGUE_IDS = new Set<PathId>(PATHS.map((p) => p.id));

/** Representative subscription sets: none, explicit none, one, two, exotic. */
const SUB_SETS: readonly (readonly Subscription[])[] = [
  [],
  ["none"],
  ["claude-pro"],
  ["chatgpt-plus", "claude-pro"],
  ["gemini", "other"],
];

/** Knowledge profiles over whatever deck stage 1 produced for this persona. */
function knowledgeProfiles(base: Omit<PetaAnswers, "known" | "situation">): readonly ConceptId[][] {
  const deck = conceptsFor(base).map((c) => c.id);
  return [
    [],
    deck.filter((_, i) => i % 2 === 0),
    deck.filter((c) => CONCEPTS.find((x) => x.id === c)?.tier === "dasar"),
    [...deck],
    // Ids from OUTSIDE this persona's deck: a stale array left over from a
    // back-navigation must not inflate the level.
    [...CONCEPTS.map((c) => c.id)],
  ];
}

/** Branch answers: omitted, every-first-option, every-last-option. */
function situationProfiles(base: Omit<PetaAnswers, "known" | "situation">): readonly (SituationAnswers | undefined)[] {
  const branch = questionsFor(base).filter((q) => q.stage === "situasi" && q.kind === "pilih-satu");
  if (branch.length === 0) return [undefined, {}];
  const first: Record<string, string> = {};
  const last: Record<string, string> = {};
  for (const q of branch) {
    if (q.kind !== "pilih-satu") continue;
    const opts = q.options;
    first[q.id] = opts[0]!.value;
    last[q.id] = opts[opts.length - 1]!.value;
  }
  return [undefined, first as SituationAnswers, last as SituationAnswers];
}

type Problem = string;

function checkResult(answers: PetaAnswers, label: string, problems: Problem[], seen: Set<PathId>): string {
  const r = assess(answers);

  if (r === undefined || r === null) {
    problems.push(`${label}: no result`);
    return "none";
  }
  if (!["pemula", "terbiasa", "menengah", "lanjut"].includes(r.level)) problems.push(`${label}: bad level ${r.level}`);
  if (r.levelLabel.length === 0) problems.push(`${label}: empty levelLabel`);
  if (!r.levelReason.includes("kamu")) problems.push(`${label}: levelReason not second person`);
  if (r.headline.length === 0) problems.push(`${label}: empty headline`);

  // 1. THE FLOOR.
  if (r.paths.length < 2 || r.paths.length > 3) problems.push(`${label}: ${r.paths.length} paths`);
  const ids = new Set<PathId>();
  let previous = Infinity;
  for (const p of r.paths) {
    seen.add(p.id);
    if (ids.has(p.id)) problems.push(`${label}: duplicate path ${p.id}`);
    ids.add(p.id);
    if (!CATALOGUE_IDS.has(p.id)) problems.push(`${label}: unknown path ${p.id}`);
    if (!Number.isInteger(p.score) || p.score < 0 || p.score > 100) problems.push(`${label}: score ${p.score}`);
    if (p.score > previous) problems.push(`${label}: ${p.id} out of rank order`);
    previous = p.score;
    // Rank 1 must ALWAYS have an earned reason — the winner is the one claim the
    // whole screen rests on. Lower ranks may carry the honest "this is not the
    // best fit for you" line instead; inventing a fit for them is the defect
    // this sweep now guards against, not a shape to enforce.
    const earned = p.reason.startsWith("Cocok karena kamu ");
    const honest = p.reason.startsWith("Bukan yang paling pas");
    if (!earned && !honest) problems.push(`${label}: reason "${p.reason}"`);
    if (p === r.paths[0] && !earned) problems.push(`${label}: rank 1 has no earned reason`);
    if (!p.reason.endsWith(".")) problems.push(`${label}: reason unterminated`);
    if (p.reason.includes(" dan .") || p.reason.includes("undefined")) problems.push(`${label}: reason malformed`);
    if (p.courses.length === 0) problems.push(`${label}: ${p.id} has no courses`);
    if (p.thisWeek.length !== 3) problems.push(`${label}: ${p.id} has ${p.thisWeek.length} steps`);
    for (const step of p.thisWeek) {
      if (step.trim().length < 10 || step.includes("undefined")) problems.push(`${label}: bad step "${step}"`);
    }
  }

  // 2. BUDGET. Rp0 must yield a plan with nothing to buy.
  if (r.budget.free.length === 0) problems.push(`${label}: no free tier named`);
  if (answers.budget === "zero" && r.budget.paid.length > 0) problems.push(`${label}: Rp0 plan recommends paying`);
  if (r.budget.headline.length === 0) problems.push(`${label}: empty budget headline`);
  const paidSubs = answers.subscriptions.filter((s) => s !== "none");
  if (paidSubs.length > 0 && r.budget.useWhatYouPayFor.length !== paidSubs.length) {
    problems.push(`${label}: paid subscriptions ignored`);
  }
  for (const line of r.budget.useWhatYouPayFor) if (line.length === 0) problems.push(`${label}: empty sub advice`);

  // 3. GAPS. Only ever concepts this persona was actually ASKED about.
  const deck = new Set(conceptsFor(answers).map((c) => c.id));
  const known = new Set(answers.known);
  if (r.gaps.length > 4) problems.push(`${label}: ${r.gaps.length} gaps`);
  for (const g of r.gaps) {
    if (!deck.has(g.concept)) problems.push(`${label}: gap ${g.concept} was never asked`);
    if (known.has(g.concept)) problems.push(`${label}: gap ${g.concept} is known`);
    if (g.why.length === 0) problems.push(`${label}: gap ${g.concept} has no reason`);
    if (g.materi !== null && g.materi.materiSlug.length === 0) problems.push(`${label}: gap ${g.concept} bad materi`);
  }

  return r.level;
}

describe("sweep A — full single-choice cross product", () => {
  it("is total, always returns 2–3 paths, and reaches every path in the catalogue", () => {
    const problems: Problem[] = [];
    const seen = new Set<PathId>();
    const levels = new Set<string>();
    let runs = 0;

    for (const tenure of TENURE_OPTIONS) {
      for (const role of ROLE_OPTIONS) {
        for (const goal of GOAL_OPTIONS) {
          for (const budget of BUDGET_OPTIONS) {
            for (const weeklyTime of WEEKLY_TIME_OPTIONS) {
              for (const subscriptions of SUB_SETS) {
                const base = {
                  tenure: tenure.value,
                  role: role.value,
                  goal: goal.value,
                  budget: budget.value,
                  weeklyTime: weeklyTime.value,
                  subscriptions,
                } satisfies Omit<PetaAnswers, "known" | "situation">;
                for (const known of knowledgeProfiles(base)) {
                  for (const situation of situationProfiles(base)) {
                    runs++;
                    levels.add(
                      checkResult(
                        { ...base, known, situation },
                        `${tenure.value}/${role.value}/${goal.value}/${budget.value}/${weeklyTime.value}`,
                        problems,
                        seen,
                      ),
                    );
                  }
                }
              }
            }
          }
        }
      }
    }

    // 3,456 single-choice combinations is the whole cross product.
    expect(runs).toBeGreaterThan(100_000);
    expect(problems.slice(0, 10)).toEqual([]);
    expect(problems).toHaveLength(0);

    // REACHABILITY, both directions: nothing shown that is not catalogued, and
    // nothing catalogued that is never shown.
    expect([...seen].sort()).toEqual([...CATALOGUE_IDS].sort());
    // All four levels are reachable — none is a decoration.
    expect([...levels].sort()).toEqual(["lanjut", "menengah", "pemula", "terbiasa"]);
  }, 120_000);
});

describe("sweep B — every knowledge subset", () => {
  const ALL = CONCEPTS.map((c) => c.id);

  // Personas whose stage 1 opens all three tiers, so all 13 cards are asked and
  // every subset is meaningful rather than silently ignored.
  const PERSONAS: readonly Omit<PetaAnswers, "known" | "situation">[] = [
    {
      tenure: "over1y",
      role: "developer",
      goal: "build-app",
      budget: "over300k",
      weeklyTime: "over7h",
      subscriptions: ["claude-pro"],
    },
    {
      tenure: "over1y",
      role: "office",
      goal: "save-time",
      budget: "zero",
      weeklyTime: "1to3h",
      subscriptions: [],
    },
    {
      tenure: "3to12m",
      role: "developer",
      goal: "career",
      budget: "under100k",
      weeklyTime: "under1h",
      subscriptions: ["none"],
    },
  ];

  it("is total over all 8,192 subsets and every level stays reachable", () => {
    const problems: Problem[] = [];
    const seen = new Set<PathId>();
    const levels = new Set<string>();
    let runs = 0;

    for (const base of PERSONAS) {
      for (let mask = 0; mask < 1 << ALL.length; mask++) {
        const known: ConceptId[] = [];
        for (let bit = 0; bit < ALL.length; bit++) if (mask & (1 << bit)) known.push(ALL[bit]!);
        const answers: PetaAnswers = { ...base, known, situation: {} };
        levels.add(checkResult(answers, `${base.role}/mask${mask}`, problems, seen));
        runs++;
      }
    }

    expect(runs).toBe(PERSONAS.length * 2 ** ALL.length);
    expect(problems.slice(0, 10)).toEqual([]);
    expect(problems).toHaveLength(0);
    // `pemula` is correctly UNREACHABLE here: opening all three tiers needs at
    // least 3 months of use, and 3 months alone already earns Terbiasa. Sweep A
    // covers the beginner tenures and proves all four levels are reachable.
    expect([...levels].sort()).toEqual(["lanjut", "menengah", "terbiasa"]);
  }, 120_000);
});
