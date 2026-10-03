import type { PlatformAnalyticsData } from "../types";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";
import { platformNumber, platformPercent } from "../lib/platform-format";

export function PlatformSummary({ data, copy }: { data: PlatformAnalyticsData; copy: PlatformAnalyticsCopy }) {
  const counts = (keys: readonly (keyof Omit<PlatformAnalyticsData["summary"], "quizPassRate">)[]) => (
    <dl className="mt-3 grid grid-cols-2 divide-x divide-border border-y border-border sm:grid-cols-3 xl:grid-cols-5">
      {keys.map((key) => <div key={key} className="min-w-0 px-3 py-4"><dt className="break-words text-xs text-muted-foreground">{copy[key]}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{data.summary[key].exact ? "" : "≥ "}{platformNumber(data.summary[key].value)}</dd></div>)}
    </dl>
  );
  return <>
    <section aria-label={copy.inventory}><h2 className="text-lg font-semibold">{copy.inventory}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.inventoryHint}</p>{counts(["users", "communities", "memberships", "courses", "lessons", "skills", "quizzes"])}</section>
    <section aria-label={copy.activity}><h2 className="text-lg font-semibold">{copy.activity}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.activityHint}</p>{counts(["activeLearners", "readMemberDays", "lessonCompletions", "badges", "quizAttempts", "quizPassed", "comments", "newMembers"])}</section>
    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><p>{copy.quizPassRate}: <strong className="tabular-nums">{platformPercent(data.summary.quizPassRate)}</strong></p><p>{copy.neverRead}: <strong className="tabular-nums">{data.inventory.neverReadLessons.exact ? "" : "≥ "}{platformNumber(data.inventory.neverReadLessons.value)}</strong></p></div>
    <div className="grid gap-4 border-t border-border pt-4 md:grid-cols-3">
      {(["tenantStatus", "courseStatus", "membershipRole"] as const).map((group) => <section key={group} aria-label={copy[group]}><h3 className="text-sm font-medium">{copy[group]}</h3><dl className="mt-2 space-y-1 text-sm">{Object.entries(data.inventory[group]).map(([key, count]) => <div key={key} className="flex items-baseline justify-between gap-3"><dt className="text-muted-foreground">{copy[key as keyof PlatformAnalyticsCopy]}</dt><dd className="tabular-nums">{count.exact ? "" : "≥ "}{platformNumber(count.value)}</dd></div>)}</dl></section>)}
    </div>
  </>;
}
