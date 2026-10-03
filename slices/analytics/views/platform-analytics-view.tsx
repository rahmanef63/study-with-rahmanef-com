"use client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformAnalyticsDashboard } from "../components/platform-analytics-dashboard";
import { PlatformQueryBoundary } from "../components/platform-query-boundary";
import { usePlatformAnalytics } from "../hooks/use-platform-analytics";
import { mergePlatformAnalyticsCopy, type PlatformAnalyticsCopyOverride } from "../config/platform-copy";
import type { PlatformAnalyticsDays } from "../types";

export type PlatformAnalyticsViewProps = { enabled: boolean; copy?: PlatformAnalyticsCopyOverride };
function PlatformAnalyticsRead({ enabled, days, onDaysChange, copy: override }: PlatformAnalyticsViewProps & { days: PlatformAnalyticsDays; onDaysChange: (days: PlatformAnalyticsDays) => void }) {
  const data = usePlatformAnalytics({ enabled, days });
  const copy = mergePlatformAnalyticsCopy(override);
  if (!enabled) return null;
  if (data === undefined) return <div role="status" aria-label={copy.loading} className="space-y-4"><p className="text-sm text-muted-foreground">{copy.loading}</p><Skeleton className="h-11 w-60 max-w-full" /><Skeleton className="h-36 w-full" /><Skeleton className="h-64 w-full" /></div>;
  return <PlatformAnalyticsDashboard data={data} days={days} onDaysChange={onDaysChange} copy={override} />;
}
export function PlatformAnalyticsView({ enabled, copy: override }: PlatformAnalyticsViewProps) {
  const [days, setDays] = useState<PlatformAnalyticsDays>(30);
  const [retry, setRetry] = useState(0);
  const copy = mergePlatformAnalyticsCopy(override);
  return <PlatformQueryBoundary key={`${enabled}:${days}:${retry}`} copy={copy} onRetry={() => setRetry((value) => value + 1)}><PlatformAnalyticsRead enabled={enabled} days={days} onDaysChange={setDays} copy={override} /></PlatformQueryBoundary>;
}
