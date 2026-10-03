"use client";
import { Button } from "@/components/ui/button";
import type { PlatformTrafficData, PlatformTrafficDays } from "../types";
import { mergePlatformTrafficCopy, type PlatformTrafficCopyOverride } from "../config/traffic-copy";
import { platformDate, platformNumber } from "../lib/platform-format";
import { PlatformTrafficTrends } from "./platform-traffic-trends";
import { PlatformTrafficRankings } from "./platform-traffic-rankings";

export type PlatformTrafficDashboardProps = { data: PlatformTrafficData; days: PlatformTrafficDays; onDaysChange: (days: PlatformTrafficDays) => void; copy?: PlatformTrafficCopyOverride };
export function PlatformTrafficDashboard({ data, days, onDaysChange, copy: override }: PlatformTrafficDashboardProps) {
  const copy = mergePlatformTrafficCopy(override);
  const incomplete = data.sources.some((source) => !source.complete);
  return <div className="min-w-0 space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div role="group" aria-label={copy.period} className="flex gap-1">{([7, 30] as const).map((period) => <Button key={period} variant={days === period ? "default" : "outline"} className="min-h-11" aria-pressed={days === period} onClick={() => onDaysChange(period)}>{period} {copy.days}</Button>)}</div>
      <p className="text-sm text-muted-foreground">{copy.dates}: <time dateTime={data.period.from}>{platformDate(data.period.from)}</time> — <time dateTime={data.period.to}>{platformDate(data.period.to)}</time> · WIB</p>
    </div>
    {incomplete ? <p role="status" className="border-l-4 border-primary bg-muted px-4 py-3 text-sm">{copy.capped}</p> : null}
    <section aria-label={copy.summary}><h2 className="text-lg font-semibold">{copy.summary}</h2><dl className="mt-3 grid grid-cols-2 divide-x divide-border border-y border-border sm:grid-cols-3 xl:grid-cols-5">{(["pageViews", "sessions", "ctaClicks", "directViews", "droppedEvents"] as const).map((key) => <div key={key} className="min-w-0 px-3 py-4"><dt className="break-words text-xs text-muted-foreground">{copy[key]}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{data.summary[key].exact ? "" : "≥ "}{platformNumber(data.summary[key].value)}</dd></div>)}</dl></section>
    <p className="text-sm text-muted-foreground">{copy.sessionNote}</p>
    <p className="text-sm text-muted-foreground">{copy.geoNote} <a href="https://db-ip.com" target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{copy.geoAttribution}</a>.</p>
    <PlatformTrafficTrends data={data} copy={copy} />
    <PlatformTrafficRankings data={data} copy={copy} />
    <details className="min-w-0 border-t border-border pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">{copy.privacy}</summary><div className="space-y-3 pt-3 text-sm text-muted-foreground"><p>{copy.privacyNote}</p><p>{copy.retentionNote}</p><p>{copy.earliest}: {data.collectionStart === null ? copy.unknown : platformDate(data.collectionStart, true)}. {copy.earliestNote}</p><p>{copy.source}: {data.sources.map((source) => `${source.name}: ${platformNumber(source.rowsRead)} ${copy.rowsRead.toLocaleLowerCase("id-ID")} (${source.complete ? copy.complete : copy.partial})`).join(" · ")}</p></div></details>
  </div>;
}
