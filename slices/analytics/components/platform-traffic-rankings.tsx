"use client";
import { useId, useState } from "react";
import { Input } from "@/components/ui/input";
import type { PlatformTrafficData } from "../types";
import type { PlatformTrafficCopy } from "../config/traffic-copy";
import { platformDate, type AggregateColumn } from "../lib/platform-format";
import { PlatformComparisonTable } from "./platform-comparison-table";

type Bucket = PlatformTrafficData["topPaths"][number];
type Session = PlatformTrafficData["recentSessions"][number];
export function PlatformTrafficRankings({ data, copy }: { data: PlatformTrafficData; copy: PlatformTrafficCopy }) {
  const id = useId();
  const [search, setSearch] = useState("");
  const term = search.trim().toLocaleLowerCase("id-ID");
  const filename = (kind: string) => `study-trafik-${kind}-${data.period.from}-${data.period.to}.csv`;
  const label = (value: string | null) => value === null || value === "unknown" || value === "Unknown" ? copy.unknown : value === "direct" ? copy.direct : value === "mobile" || value === "tablet" || value === "desktop" ? copy[value] : value;
  const complete = data.sources.every((source) => source.complete);
  const coverage = { key: "complete", label: copy.completeness, value: () => complete ? copy.complete : copy.partial };
  const rankingColumns: AggregateColumn<Bucket>[] = [{ key: "key", label: copy.ranking, value: (row) => label(row.key) }, { key: "count", label: copy.events, value: (row) => row.count }, coverage];
  const sessionColumns: AggregateColumn<Session>[] = [
    { key: "id", label: copy.session, value: (row) => row.id },
    { key: "firstSeen", label: copy.firstSeen, value: (row) => new Date(row.firstSeen).toISOString(), format: (row) => platformDate(row.firstSeen, true) },
    { key: "lastSeen", label: copy.lastSeen, value: (row) => new Date(row.lastSeen).toISOString(), format: (row) => platformDate(row.lastSeen, true) },
    { key: "pages", label: copy.pageViews, value: (row) => row.pages },
    { key: "lastPath", label: copy.lastPath, value: (row) => row.lastPath },
    { key: "referrerHost", label: copy.referrer, value: (row) => row.referrerHost ?? copy.direct },
    { key: "viewport", label: copy.viewport, value: (row) => label(row.viewport) },
    { key: "browser", label: copy.browser, value: (row) => label(row.browser) },
    { key: "os", label: copy.os, value: (row) => label(row.os) },
    { key: "country", label: copy.country, value: (row) => label(row.country) },
    { key: "city", label: copy.city, value: (row) => label(row.city) }, coverage,
  ];
  return <div className="min-w-0 space-y-7">
    <label className="block space-y-2 border-t border-border pt-6 text-sm" htmlFor={`${id}-search`}><span>{copy.search}</span><Input id={`${id}-search`} type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11" /></label>
    <div className="grid min-w-0 gap-x-8 gap-y-7 xl:grid-cols-2">
      {(["topPaths", "topReferrers", "topSources", "topCampaigns", "topViewports", "topBrowsers", "topOs", "topLanguages", "topTimezones", "topCountries", "topCities", "topCtas"] as const).map((key) => <PlatformComparisonTable key={key} title={copy[key]} rows={data[key].filter((row) => label(row.key).toLocaleLowerCase("id-ID").includes(term))} columns={rankingColumns} rowKey={(row) => row.key} filename={filename(key)} empty={copy.empty} labels={copy} minWidth={360} initialSortKey="count" initialDescending />)}
    </div>
    <PlatformComparisonTable title={copy.recent} hint={copy.recentHint} rows={data.recentSessions.filter((row) => `${row.id} ${row.lastPath} ${row.referrerHost ?? copy.direct} ${row.browser ?? ""} ${row.os ?? ""} ${row.country ?? ""} ${row.city ?? ""}`.toLocaleLowerCase("id-ID").includes(term))} columns={sessionColumns} rowKey={(row) => row.id} filename={filename("sesi")} empty={copy.empty} labels={copy} minWidth={1000} initialSortKey="lastSeen" initialDescending />
  </div>;
}
