"use client";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PlatformAnalyticsData, PlatformAnalyticsDays } from "../types";
import { mergePlatformAnalyticsCopy, type PlatformAnalyticsCopyOverride } from "../config/platform-copy";
import { platformDate, platformNumber } from "../lib/platform-format";
import { PlatformSummary } from "./platform-summary";
import { PlatformTrend } from "./platform-trend";
import { PlatformTables } from "./platform-tables";

export type PlatformAnalyticsDashboardProps = {
  data: PlatformAnalyticsData;
  days: PlatformAnalyticsDays;
  onDaysChange: (days: PlatformAnalyticsDays) => void;
  copy?: PlatformAnalyticsCopyOverride;
};
export function PlatformAnalyticsDashboard({ data, days, onDaysChange, copy: override }: PlatformAnalyticsDashboardProps) {
  const id = useId();
  const copy = mergePlatformAnalyticsCopy(override);
  const [search, setSearch] = useState("");
  const [community, setCommunity] = useState("");
  const incomplete = data.sources.some((source) => !source.complete);
  return <div className="min-w-0 space-y-7">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <div role="group" aria-label={copy.period} className="flex flex-wrap gap-1">{([7, 30, 90] as const).map((period) => <Button key={period} variant={days === period ? "default" : "outline"} className="min-h-11" aria-pressed={days === period} onClick={() => onDaysChange(period)}>{period} {copy.days}</Button>)}</div>
      <p className="text-sm text-muted-foreground">{copy.updated}: <time dateTime={data.period.from}>{platformDate(data.period.from)}</time> — <time dateTime={data.period.to}>{platformDate(data.period.to)}</time> · WIB</p>
    </div>
    {incomplete ? <p role="status" className="border-l-4 border-primary bg-muted px-4 py-3 text-sm">{copy.incomplete}</p> : null}
    <PlatformSummary data={data} copy={copy} />
    <PlatformTrend rows={data.series} copy={copy} filename={`study-harian-${data.period.from}-${data.period.to}.csv`} />
    <div className="space-y-3 border-t border-border pt-5">
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(12rem,20rem)]">
        <label className="min-w-0 space-y-2 text-sm" htmlFor={`${id}-search`}><span>{copy.search}</span><Input id={`${id}-search`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11" /></label>
        <label className="min-w-0 space-y-2 text-sm" htmlFor={`${id}-community`}><span>{copy.communityFilter}</span><select id={`${id}-community`} value={community} onChange={(event) => setCommunity(event.target.value)} className="min-h-11 w-full min-w-0 rounded-[var(--radius)] border border-input bg-background px-3 focus-visible:outline-2 focus-visible:outline-ring"><option value="">{copy.allCommunities}</option>{data.communities.map((row) => <option key={row.tenantId} value={row.slug}>{row.name}</option>)}</select></label>
      </div>
      <p className="text-xs text-muted-foreground">{copy.tablesFilter}</p>
    </div>
    <PlatformTables data={data} search={search} community={community} copy={copy} />
    <details className="min-w-0 border-t border-border pt-3">
      <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">{copy.definitions}</summary>
      <div className="space-y-3 pt-3 text-sm text-muted-foreground"><p>{copy.membersOnly}</p><p>{copy.inventoryDefinition}</p><p>{copy.learnerDefinition}</p><p>{copy.completionDefinition}</p><p>{copy.dateDefinition}</p></div>
      <div role="region" aria-label={copy.sources} tabIndex={0} className="mt-4 min-w-0 overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring">
        <table className="w-full min-w-[360px] text-left text-sm"><caption className="sr-only">{copy.sources}</caption><thead><tr><th scope="col" className="py-2">{copy.source}</th><th scope="col">{copy.rowsRead}</th><th scope="col">{copy.completeness}</th></tr></thead><tbody>{data.sources.map((source) => <tr key={source.name} className="border-t border-border"><th scope="row" className="break-words py-2 pr-3 font-normal">{source.name}</th><td className="tabular-nums">{platformNumber(source.rowsRead)}</td><td>{source.complete ? copy.complete : copy.partial}</td></tr>)}</tbody></table>
      </div>
    </details>
  </div>;
}
