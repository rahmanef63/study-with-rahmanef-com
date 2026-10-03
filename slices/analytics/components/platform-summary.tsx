import type { PlatformAnalyticsData } from "../types";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";
import { platformNumber, platformPercent } from "../lib/platform-format";
import { PlatformBreakdown } from "./platform-breakdown";

type SummaryKey = keyof Omit<PlatformAnalyticsData["summary"], "quizPassRate">;

function figure(count: { value: number; exact: boolean }) {
  return `${count.exact ? "" : "≥ "}${platformNumber(count.value)}`;
}

function MetricRows({ keys, data, copy }: { keys: readonly SummaryKey[]; data: PlatformAnalyticsData; copy: PlatformAnalyticsCopy }) {
  return (
    <dl className="grid gap-x-8 sm:grid-cols-2">
      {keys.map((key) => (
        <div key={key} className="flex items-baseline justify-between gap-3 border-b border-border py-2">
          <dt className="text-sm text-muted-foreground">{copy[key]}</dt>
          <dd className="text-lg font-semibold tabular-nums">{figure(data.summary[key])}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PlatformSummary({ data, copy }: { data: PlatformAnalyticsData; copy: PlatformAnalyticsCopy }) {
  return (
    <>
      <section aria-label={copy.inventory} className="space-y-4 border bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">{copy.inventory}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.inventoryHint}</p>
        </div>
        <MetricRows keys={["users", "communities", "memberships", "courses", "lessons", "skills", "quizzes"]} data={data} copy={copy} />
        <p className="text-sm">{copy.neverRead}: <strong className="tabular-nums">{figure(data.inventory.neverReadLessons)}</strong></p>
        <PlatformBreakdown data={data} copy={copy} />
      </section>
      <section aria-label={copy.activity} className="space-y-4 border bg-card p-4">
        <div>
          <h2 className="text-lg font-semibold">{copy.activity}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{copy.activityHint}</p>
        </div>
        <MetricRows keys={["activeLearners", "readMemberDays", "lessonCompletions", "badges", "quizAttempts", "quizPassed", "comments", "newMembers"]} data={data} copy={copy} />
        <p className="text-sm">{copy.quizPassRate}: <strong className="tabular-nums">{platformPercent(data.summary.quizPassRate)}</strong></p>
      </section>
    </>
  );
}
