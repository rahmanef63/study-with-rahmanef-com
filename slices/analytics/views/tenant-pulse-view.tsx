"use client";
// analytics slice — connected community pulse (instructor+). The screen an
// instructor sees BEFORE picking a course: is anyone here this week, and which
// materi are being ignored.
//
// It leads with `neverReadCount` rather than a total, because on a platform
// with 128 materi and 8 members the actionable number is the count of materi
// nobody has ever opened — a total read count just says "small".
//
// Server-side authz on `tenantPulse` is the security boundary.
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { MembersOnlyNote } from "../components/members-only-note";
import { PulseMateriList } from "../components/pulse-materi-list";
import { StatCard } from "../components/stat-card";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import { useTenantPulse } from "../hooks/use-insight";

export type TenantPulseViewProps = {
  tenantId: Id<"tenants">;
  /** Permalink builder for a materi slug. Omitted → titles render as text. */
  materiHref?: (lessonSlug: string) => string;
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function TenantPulseView({
  tenantId,
  materiHref,
  copy: copyOverride,
  className,
}: TenantPulseViewProps) {
  const copy = mergeAnalyticsCopy(copyOverride);
  const pulse = useTenantPulse(tenantId);

  if (pulse === undefined) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <section className={cn("space-y-4", className)} aria-label={copy.pulseSectionTitle}>
      {/* Two columns at 390px, four from sm. Four cards in a row on a phone
          would put a three-digit number in a 90px box. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label={copy.statMembers} value={pulse.memberCount} />
        <StatCard label={copy.pulseActiveWeek} value={pulse.activeThisWeek} />
        <StatCard label={copy.pulseCompletionsWeek} value={pulse.completionsThisWeek} />
        <StatCard
          label={copy.pulseNeverRead}
          value={pulse.neverReadCount}
          hint={`dari ${pulse.materiCount} materi`}
        />
      </div>

      <MembersOnlyNote copy={copyOverride} />

      {/* BOTH ENDS ONLY WHEN THERE ARE TWO ENDS. `tenantPulse` caps each list at
          five over the SAME materi array, so a community with five or fewer
          materi gets the identical set twice, once reversed — which reads as a
          bug and teaches the instructor to distrust the screen. Caught on a
          fixture at 390px, not in review. Above the threshold the two lists
          still overlap a little on a small catalogue; that is honest (a materi
          really can be both the most and the least read of six). */}
      <div className={cn("grid gap-4", pulse.materiCount > pulse.mostRead.length && "sm:grid-cols-2")}>
        <PulseMateriList
          title={copy.pulseMostRead}
          materi={pulse.mostRead}
          hrefFor={materiHref}
          copy={copyOverride}
        />
        {pulse.materiCount > pulse.mostRead.length ? (
          <PulseMateriList
            title={copy.pulseLeastRead}
            materi={pulse.leastRead}
            hint={copy.pulseNeverReadHint}
            hrefFor={materiHref}
            copy={copyOverride}
          />
        ) : null}
      </div>
    </section>
  );
}
