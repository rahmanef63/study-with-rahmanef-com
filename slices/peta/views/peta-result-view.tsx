"use client";
// THE RESULT SCREEN — the actual product. The deck is the price of admission;
// this is what the visitor came for, so it gets the care.
//
// Everything on it is derived, in this order:
//   assess(answers)                → the plan, from pure arithmetic
//   resolveAgainstCatalogue(…)     → the same plan with every dead link removed
//   encodeRun(answers)             → the permalink, with nothing stored
//
// `assess` is a pure function with no clock and no randomness, so this render
// is stable across reloads, across devices and across the share link. That is
// also what keeps the feature inside the zero-cost law: no model call is made
// here or anywhere else in the flow (DECISIONS #34).
import { useMemo } from "react";
import { DEFAULT_COMMUNITY_SLUG } from "@/lib/community";
import { assess } from "@/lib/peta";
import type { PetaAnswers } from "@/lib/peta";
import { BudgetBlock } from "../components/result/budget-block";
import { GapsBlock } from "../components/result/gaps-block";
import { LevelBlock } from "../components/result/level-block";
import { PathCard } from "../components/result/path-card";
import { PrimaryCta } from "../components/result/primary-cta";
import { ResultActions } from "../components/result/result-actions";
import { useSavePeta } from "../hooks/use-save-peta";
import { communityFor, resolveAgainstCatalogue } from "../lib/catalogue";
import { encodeRun } from "../lib/code";
import type { LiveCatalogue } from "../types";

export type PetaResultViewProps = {
  answers: PetaAnswers;
  catalogue: LiveCatalogue;
  /** Reopen the run at its last question (see ResultActions). */
  onBack: () => void;
  onReset: () => void;
};

export function PetaResultView({ answers, catalogue, onBack, onReset }: PetaResultViewProps) {
  const result = useMemo(
    () => resolveAgainstCatalogue(assess(answers), catalogue),
    [answers, catalogue]
  );
  const code = useMemo(() => encodeRun(answers), [answers]);

  const top = result.paths[0];
  const community = top === undefined ? null : communityFor(catalogue, top.communitySlug);
  const firstCourse = top?.courses[0];

  // Fire-and-forget, and only for someone already signed in. Never a gate.
  useSavePeta(answers, result, community?.tenantId);

  return (
    <div className="space-y-8">
      <LevelBlock result={result} />

      {community !== null && firstCourse !== undefined ? (
        <PrimaryCta
          tenantId={community.tenantId}
          communitySlug={firstCourse.communitySlug}
          courseSlug={firstCourse.courseSlug}
          courseTitle={firstCourse.title}
        />
      ) : null}

      <section className="space-y-3">
        <h2>
          {result.paths.length === 2 ? "Dua jalur" : "Tiga jalur"} yang cocok buat kamu
        </h2>
        <div className="grid gap-4">
          {result.paths.map((path, index) => (
            <PathCard key={path.id} path={path} rank={index + 1} />
          ))}
        </div>
      </section>

      <BudgetBlock budget={result.budget} />
      {/* "Usulkan materi" needs SOME community to post into; the top path's is
          the one the visitor is being sent to. The flagship is the fallback for
          the impossible case where ranking returned nothing. */}
      <GapsBlock gaps={result.gaps} communitySlug={top?.communitySlug ?? DEFAULT_COMMUNITY_SLUG} />
      <ResultActions
        code={code}
        headline={result.headline}
        onBack={onBack}
        onReset={onReset}
      />
    </div>
  );
}
