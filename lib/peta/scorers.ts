// Per-path scoring. One pure arithmetic function per catalogue entry, kept
// apart from the ranking in match.ts so each file stays under the 200-LOC
// ceiling and so a tuning change touches numbers only.
//
// Weights are hand-set, not learnt: the whole point of DECISIONS #34 is that
// this feature costs nothing to run. Two invariants the exhaustive test holds
// them to — every path can win for somebody, and none of them can throw.
import { BUDGET_RANK, TENURE_RANK, TIME_RANK } from "./options";
import type { ConceptId, PetaAnswers } from "./types";
import type { Level, PathId } from "./result";

export type MatchContext = {
  answers: PetaAnswers;
  level: Level;
  known: ReadonlySet<ConceptId>;
  /** Concepts that were asked and NOT known. */
  missing: ReadonlySet<ConceptId>;
  tool: string;
};

const LEVEL_SCORE = (level: Level, m: Record<Level, number>): number => m[level];

export const SCORERS: Record<PathId, (m: MatchContext) => number> = {
  fondasi: (m) => {
    const missingDasar = ["prompt", "hallucination", "context-window", "data-privacy"].filter((id) =>
      m.missing.has(id as ConceptId),
    ).length;
    return (
      5 +
      [40, 30, 8, 0][TENURE_RANK[m.answers.tenure]] +
      LEVEL_SCORE(m.level, { pemula: 25, terbiasa: 12, menengah: 0, lanjut: -25 }) +
      (m.answers.goal === "curious" ? 12 : 0) +
      missingDasar * 4
    );
  },
  "produktivitas-kerja": (m) => {
    const role: Record<PetaAnswers["role"], number> = {
      office: 26,
      teacher: 24,
      "business-owner": 24,
      marketing: 12,
      other: 12,
      analyst: 10,
      student: 8,
      unemployed: 4,
      developer: 0,
    };
    return (
      5 +
      (m.answers.goal === "save-time" ? 38 : 0) +
      role[m.answers.role] +
      (TIME_RANK[m.answers.weeklyTime] >= 1 ? 8 : 0) +
      LEVEL_SCORE(m.level, { pemula: 4, terbiasa: 12, menengah: 10, lanjut: 2 }) +
      (TENURE_RANK[m.answers.tenure] >= 1 ? 6 : 0)
    );
  },
  "prompt-andalan": (m) => {
    const goal: Record<PetaAnswers["goal"], number> = {
      "save-time": 14,
      curious: 12,
      "make-content": 10,
      "work-with-data": 8,
      "build-app": 6,
      career: 6,
    };
    const readyForTechnique = m.known.has("prompt") && (m.missing.has("few-shot") || m.missing.has("chain-of-thought"));
    return (
      5 +
      LEVEL_SCORE(m.level, { pemula: 0, terbiasa: 28, menengah: 26, lanjut: 10 }) +
      (readyForTechnique ? 24 : 0) +
      goal[m.answers.goal] +
      [0, 6, 14, 10][TENURE_RANK[m.answers.tenure]] +
      (TIME_RANK[m.answers.weeklyTime] >= 1 ? 5 : 0)
    );
  },
  "olah-data": (m) => {
    const role: Partial<Record<PetaAnswers["role"], number>> = {
      analyst: 28,
      "business-owner": 10,
      office: 8,
      student: 5,
      teacher: 5,
    };
    const comfort = { yes: 10, somewhat: 6, no: 2 }[m.answers.situation?.spreadsheetComfort ?? "no"];
    return (
      5 +
      (m.answers.goal === "work-with-data" ? 45 : 0) +
      (role[m.answers.role] ?? 0) +
      (m.answers.situation?.spreadsheetComfort === undefined ? 0 : comfort) +
      (m.level === "menengah" || m.level === "lanjut" ? 5 : 0)
    );
  },
  "bikin-aplikasi": (m) => {
    const role: Partial<Record<PetaAnswers["role"], number>> = { developer: 28, student: 6, other: 3 };
    const coding = { routinely: 10, sometimes: 8, "not-yet": 4 }[m.answers.situation?.codingWithAi ?? "not-yet"];
    return (
      5 +
      (m.answers.goal === "build-app" ? 45 : 0) +
      (role[m.answers.role] ?? 0) +
      (m.answers.situation?.codingWithAi === undefined ? 0 : coding) +
      LEVEL_SCORE(m.level, { pemula: 0, terbiasa: 4, menengah: 8, lanjut: 10 }) +
      (TIME_RANK[m.answers.weeklyTime] >= 2 ? 6 : 0)
    );
  },
  "multi-agent": (m) =>
    5 +
    LEVEL_SCORE(m.level, { pemula: -30, terbiasa: 0, menengah: 14, lanjut: 34 }) +
    (m.answers.role === "developer" ? 26 : 0) +
    (m.answers.goal === "build-app" ? 16 : m.answers.goal === "save-time" ? 4 : 0) +
    (m.known.has("agent") ? 10 : 0) +
    (m.answers.situation?.codingWithAi === "routinely" ? 8 : 0) +
    (TIME_RANK[m.answers.weeklyTime] >= 2 ? 6 : 0),
  "kreator-konten": (m) => {
    const role: Partial<Record<PetaAnswers["role"], number>> = {
      marketing: 28,
      "business-owner": 12,
      student: 6,
      other: 3,
    };
    const channel = { active: 10, dormant: 8, none: 4 }[m.answers.situation?.hasChannel ?? "none"];
    return (
      5 +
      (m.answers.goal === "make-content" ? 45 : 0) +
      (role[m.answers.role] ?? 0) +
      (m.answers.situation?.hasChannel === undefined ? 0 : channel) +
      (TIME_RANK[m.answers.weeklyTime] >= 1 ? 4 : 0)
    );
  },
  "karier-digital": (m) => {
    const role: Partial<Record<PetaAnswers["role"], number>> = {
      unemployed: 26,
      student: 20,
      marketing: 8,
      other: 8,
      "business-owner": 6,
    };
    return (
      5 +
      (m.answers.goal === "career" ? 45 : 0) +
      (role[m.answers.role] ?? 0) +
      (BUDGET_RANK[m.answers.budget] === 0 ? 6 : 0) +
      (m.level === "pemula" || m.level === "terbiasa" ? 4 : 0) +
      (TIME_RANK[m.answers.weeklyTime] >= 2 ? 5 : 0)
    );
  },
};
