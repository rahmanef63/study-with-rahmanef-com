import type { PlatformAnalyticsData } from "../types";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";
import { platformNumber } from "../lib/platform-format";

type Count = { value: number; exact: boolean };
type Row = readonly [keyof PlatformAnalyticsCopy, Count];

function figure(count: Count) {
  return `${count.exact ? "" : "≥ "}${platformNumber(count.value)}`;
}

function Bars({ title, rows, copy }: { title: string; rows: readonly Row[]; copy: PlatformAnalyticsCopy }) {
  const total = rows.reduce((sum, [, count]) => sum + count.value, 0);
  return (
    <section aria-label={title} className="min-w-0">
      <h3 className="text-sm font-medium">{title}</h3>
      <ul className="mt-3 space-y-3">
        {rows.map(([key, count]) => (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{copy[key]}</span>
              <span className="tabular-nums">{figure(count)}</span>
            </div>
            <div
              className="mt-1 h-2 bg-muted"
              role="meter"
              aria-label={copy[key]}
              aria-valuemin={0}
              aria-valuemax={Math.max(total, 1)}
              aria-valuenow={count.value}
              aria-valuetext={figure(count)}
            >
              <div className="h-full bg-primary" style={{ width: total === 0 ? "0%" : `${(count.value / total) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Horizontal bars for inventory breakdowns the analytics payload already returns. */
export function PlatformBreakdown({ data, copy }: { data: PlatformAnalyticsData; copy: PlatformAnalyticsCopy }) {
  const { tenantStatus, courseStatus, membershipRole } = data.inventory;
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Bars title={copy.tenantStatus} copy={copy} rows={[["active", tenantStatus.active], ["pending", tenantStatus.pending], ["suspended", tenantStatus.suspended]]} />
      <Bars title={copy.courseStatus} copy={copy} rows={[["published", courseStatus.published], ["draft", courseStatus.draft], ["archived", courseStatus.archived]]} />
      <Bars title={copy.membershipRole} copy={copy} rows={[["owner", membershipRole.owner], ["instructor", membershipRole.instructor], ["member", membershipRole.member]]} />
    </div>
  );
}
