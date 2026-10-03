"use client";
import { useId } from "react";
import type { PlatformTrafficData } from "../types";
import type { PlatformTrafficCopy } from "../config/traffic-copy";
import { PlatformComparisonTable } from "./platform-comparison-table";
import { platformDate, type AggregateColumn } from "../lib/platform-format";

type Day = PlatformTrafficData["series"][number];
type Hour = PlatformTrafficData["perLocalHour"][number];
export function PlatformTrafficTrends({ data, copy }: { data: PlatformTrafficData; copy: PlatformTrafficCopy }) {
  const chartDefinitionId = useId();
  const filename = (kind: string) => `study-trafik-${kind}-${data.period.from}-${data.period.to}.csv`;
  const dayColumns: AggregateColumn<Day>[] = [
    { key: "day", label: copy.day, value: (row) => row.day, format: (row) => platformDate(row.day) },
    ...(["pageViews", "sessions", "ctaClicks"] as const).map((key) => ({ key, label: copy[key], value: (row: Day) => row[key] })),
    { key: "complete", label: copy.completeness, value: (row) => row.complete ? copy.complete : copy.partial },
  ];
  const hourColumns: AggregateColumn<Hour>[] = [
    { key: "hour", label: copy.hour, value: (row) => row.hour, format: (row) => `${String(row.hour).padStart(2, "0")}:00` },
    { key: "count", label: copy.count, value: (row) => row.count },
    { key: "complete", label: copy.completeness, value: () => data.sources.every((source) => source.complete) ? copy.complete : copy.partial },
  ];
  const chart = (values: readonly { label: string; count: number }[], title: string) => {
    const max = Math.max(1, ...values.map((row) => row.count));
    return <div role="img" aria-label={title} className="mt-4 flex h-40 items-end gap-1 border-b border-border px-1 pb-1" aria-describedby={chartDefinitionId}>
      {values.map((row) => <div key={row.label} className="flex h-full min-w-0 flex-1 items-end" title={`${row.label}: ${row.count}`}><div className="w-full bg-primary" style={{ height: `${row.count * 100 / max}%` }} /></div>)}
    </div>;
  };
  return <div className="min-w-0 space-y-7">
    <p id={chartDefinitionId} className="sr-only">{copy.dailyHint} {copy.hoursHint}</p>
    <section aria-label={copy.daily} className="min-w-0 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{copy.daily}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.dailyHint}</p>
      {data.series.some((row) => row.pageViews > 0) ? <>{chart(data.series.map((row) => ({ label: platformDate(row.day), count: row.pageViews })), copy.daily)}<div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{platformDate(data.period.from)}</span><span>{platformDate(data.period.to)}</span></div></> : <p className="py-6 text-sm text-muted-foreground">{copy.noActivity}</p>}
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-ring">{copy.dailyDetails}</summary><PlatformComparisonTable title={copy.daily} rows={data.series} columns={dayColumns} rowKey={(row) => row.day} filename={filename("harian")} empty={copy.empty} labels={copy} /></details>
    </section>
    <section aria-label={copy.hours} className="min-w-0 border-t border-border pt-6">
      <h2 className="text-lg font-semibold">{copy.hours}</h2><p className="mt-1 text-sm text-muted-foreground">{copy.hoursHint}</p>
      {data.perLocalHour.some((row) => row.count > 0) ? <>{chart(data.perLocalHour.map((row) => ({ label: `${row.hour}:00`, count: row.count })), copy.hours)}<div className="mt-2 flex justify-between text-xs text-muted-foreground">{[0, 6, 12, 18, 23].map((hour) => <span key={hour}>{String(hour).padStart(2, "0")}:00</span>)}</div></> : <p className="py-6 text-sm text-muted-foreground">{copy.noActivity}</p>}
      <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm text-primary focus-visible:outline-2 focus-visible:outline-ring">{copy.hourDetails}</summary><PlatformComparisonTable title={copy.hours} rows={data.perLocalHour} columns={hourColumns} rowKey={(row) => String(row.hour)} filename={filename("jam")} empty={copy.empty} labels={copy} /></details>
    </section>
  </div>;
}
