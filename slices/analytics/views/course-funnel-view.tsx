"use client";
// analytics slice — connected drop-off view for ONE course (instructor+).
//
// Answers exactly one question, in this order: where do people stop → what does
// the whole shape look like → the numbers, materi by materi. The headline comes
// first because it is the answer; the chart and the list are the evidence.
//
// Server-side authz on `courseFunnel` is the security boundary; mounting this
// for a member throws NOT_AUTHORIZED into the surrounding error boundary.
import dynamic from "next/dynamic";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { FunnelStepList } from "../components/funnel-step-list";
import { MembersOnlyNote } from "../components/members-only-note";
import { StatCard } from "../components/stat-card";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import { useCourseFunnel } from "../hooks/use-insight";
import { biggestDrop, funnelEnds } from "../lib/dropoff";
import type { FunnelStepData } from "../types";

// recharts is ~150kB. Behind next/dynamic it is fetched only when an instructor
// opens a course, not when the console mounts. `ssr: false` because the console
// is a client island anyway and a chart has nothing to contribute to first paint.
const FunnelCurve = dynamic(
  () => import("../components/funnel-curve").then((m) => m.FunnelCurve),
  { ssr: false, loading: () => <Skeleton className="h-32 w-full sm:h-40" /> }
);

export type CourseFunnelViewProps = {
  courseId: Id<"courses">;
  copy?: AnalyticsCopyOverride;
  className?: string;
};

/** The sentence a screen reader gets in place of the curve. */
function curveLabel(steps: readonly FunnelStepData[], readers: string): string {
  const { started, reachedEnd, reachedEndPct } = funnelEnds(steps);
  const worst = biggestDrop(steps);
  const tail =
    worst === null ? "" : ` Penurunan terbesar ke materi ke-${worst.toPosition}.`;
  return `Sisa pembaca sepanjang ${steps.length} materi: mulai ${started} ${readers}, sampai materi terakhir ${reachedEnd} ${readers} (${reachedEndPct}%).${tail}`;
}

export function CourseFunnelView({
  courseId,
  copy: copyOverride,
  className,
}: CourseFunnelViewProps) {
  const copy = mergeAnalyticsCopy(copyOverride);
  const funnel = useCourseFunnel(courseId);

  if (funnel === undefined) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const { steps } = funnel;
  const worst = biggestDrop(steps);
  const ends = funnelEnds(steps);

  return (
    <section className={cn("space-y-4", className)} aria-label={copy.funnelSectionTitle}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-title font-medium">{copy.funnelSectionTitle}</h3>
          <p className="text-caption text-muted-foreground">{copy.funnelSectionHint}</p>
        </div>
        <MembersOnlyNote variant="badge" copy={copyOverride} />
      </div>

      {steps.length === 0 || ends.started === 0 ? (
        // Zero readers is not an error and not a chart. Say it plainly — this
        // is the state every course is in on the day view counting ships.
        <p className="rounded-[var(--radius)] border border-border bg-card px-3 py-4 text-footnote text-muted-foreground">
          {copy.emptyFunnel}
        </p>
      ) : (
        <>
          {/* THE ANSWER, first. */}
          <div
            className={cn(
              "space-y-1 border px-3 py-3",
              worst === null ? "border-border bg-card" : "border-destructive bg-destructive/5"
            )}
          >
            <p className="eyebrow">{worst === null ? copy.dropNobody : copy.dropHeadline}</p>
            {worst === null ? (
              <p className="text-footnote text-muted-foreground">{copy.dropNobodyHint}</p>
            ) : (
              <>
                <p className="text-footnote [overflow-wrap:anywhere]">
                  <span className="tabular-nums text-muted-foreground">
                    #{worst.toPosition}
                  </span>{" "}
                  {worst.toTitle}
                </p>
                <p className="text-caption tabular-nums text-destructive-text">
                  {worst.lost} {copy.dropLostUnit} ({worst.lostPct}%) setelah “{worst.fromTitle}”
                </p>
              </>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <StatCard label={copy.startedLabel} value={ends.started} />
            <StatCard
              label={copy.reachedEndLabel}
              value={ends.reachedEnd}
              hint={`${ends.reachedEndPct}% dari yang mulai`}
            />
          </div>

          <FunnelCurve steps={steps} label={curveLabel(steps, copy.readersUnit)} />
          <FunnelStepList steps={steps} copy={copyOverride} />
        </>
      )}
    </section>
  );
}
