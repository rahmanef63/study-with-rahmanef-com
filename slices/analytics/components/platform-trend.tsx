"use client";
import { useId } from "react";
import type { PlatformAnalyticsData } from "../types";
import type { PlatformAnalyticsCopy } from "../config/platform-copy";
import { PlatformComparisonTable } from "./platform-comparison-table";
import { platformDate, type AggregateColumn } from "../lib/platform-format";

type Day = PlatformAnalyticsData["series"][number];
export function PlatformTrend({ rows, copy, filename }: { rows: readonly Day[]; copy: PlatformAnalyticsCopy; filename: string }) {
  const id = useId();
  const metrics = [
    { key: "readMemberDays", label: copy.readMemberDays, dash: undefined },
    { key: "lessonCompletions", label: copy.lessonCompletions, dash: "7 4" },
    { key: "quizAttempts", label: copy.quizAttempts, dash: "2 4" },
  ] as const;
  const max = Math.max(1, ...rows.flatMap((row) => metrics.map((metric) => row[metric.key])));
  const points = (key: typeof metrics[number]["key"]) => rows.map((row, index) => `${40 + index * 920 / Math.max(1, rows.length - 1)},${180 - row[key] * 150 / max}`).join(" ");
  const columns: AggregateColumn<Day>[] = [
    { key: "day", label: copy.day, value: (row) => row.day, format: (row) => platformDate(row.day) },
    ...(["activeLearners", "readMemberDays", "lessonCompletions", "badges", "quizAttempts", "quizPassed", "comments", "newMembers"] as const).map((key) => ({ key, label: copy[key], value: (row: Day) => row[key] })),
    { key: "complete", label: copy.completeness, value: (row) => row.complete ? copy.complete : copy.partial },
  ];
  const hasActivity = rows.some((row) => columns.slice(1, -1).some((column) => Number(column.value(row)) > 0));
  return (
    <section aria-labelledby={`${id}-title`} className="min-w-0 border-t border-border pt-6">
      <h2 id={`${id}-title`} className="text-lg font-semibold">{copy.trends}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{copy.trendHint}</p>
      {hasActivity ? <div className="mt-3" role="img" aria-label={`${copy.trends}: ${metrics.map((metric) => metric.label).join(", ")}. ${copy.trendHint}`}>
        <svg viewBox="0 0 1000 220" className="h-48 w-full sm:h-56" aria-hidden="true" preserveAspectRatio="none">
          {[0, 0.5, 1].map((fraction) => <g key={fraction}><line x1="40" y1={180 - fraction * 150} x2="960" y2={180 - fraction * 150} stroke="var(--color-border)" /><text x="2" y={184 - fraction * 150} fontSize="12" fill="var(--color-muted-foreground)">{Math.round(max * fraction)}</text></g>)}
          {metrics.map((metric) => <polyline key={metric.key} points={points(metric.key)} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeDasharray={metric.dash} vectorEffect="non-scaling-stroke" />)}
          {rows.length > 0 ? <><text x="40" y="211" fontSize="12" fill="var(--color-muted-foreground)">{platformDate(rows[0].day)}</text><text x="960" y="211" textAnchor="end" fontSize="12" fill="var(--color-muted-foreground)">{platformDate(rows.at(-1)!.day)}</text></> : null}
        </svg>
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">{metrics.map((metric) => <li key={metric.key} className="flex items-center gap-2"><svg width="28" height="8" aria-hidden="true"><line x1="0" y1="4" x2="28" y2="4" stroke="var(--color-primary)" strokeWidth="2" strokeDasharray={metric.dash} /></svg>{metric.label}</li>)}</ul>
      </div> : <p className="py-6 text-sm text-muted-foreground">{copy.noActivity}</p>}
      <details className="mt-4"><summary className="min-h-11 cursor-pointer py-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-ring">{copy.dailyDetails}</summary><PlatformComparisonTable title={copy.trends} rows={rows} columns={columns} rowKey={(row) => row.day} filename={filename} empty={copy.empty} labels={copy} /></details>
    </section>
  );
}
