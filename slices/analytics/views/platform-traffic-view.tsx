"use client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformTrafficDashboard } from "../components/platform-traffic-dashboard";
import { PlatformQueryBoundary } from "../components/platform-query-boundary";
import { usePlatformTraffic } from "../hooks/use-platform-traffic";
import { mergePlatformAnalyticsCopy } from "../config/platform-copy";
import { mergePlatformTrafficCopy, type PlatformTrafficCopyOverride } from "../config/traffic-copy";
import type { PlatformTrafficDays } from "../types";

export type PlatformTrafficViewProps = { enabled: boolean; copy?: PlatformTrafficCopyOverride };
function PlatformTrafficRead({ enabled, days, onDaysChange, copy: override }: PlatformTrafficViewProps & { days: PlatformTrafficDays; onDaysChange: (days: PlatformTrafficDays) => void }) {
  const data = usePlatformTraffic({ enabled, days });
  const copy = mergePlatformTrafficCopy(override);
  if (!enabled) return null;
  if (data === undefined) return <div role="status" aria-label={copy.loading} className="space-y-4"><p className="text-sm text-muted-foreground">{copy.loading}</p><Skeleton className="h-11 w-60 max-w-full" /><Skeleton className="h-32 w-full" /><Skeleton className="h-64 w-full" /></div>;
  return <PlatformTrafficDashboard data={data} days={days} onDaysChange={onDaysChange} copy={override} />;
}
export function PlatformTrafficView({ enabled, copy: override }: PlatformTrafficViewProps) {
  const [days, setDays] = useState<PlatformTrafficDays>(30);
  const [retry, setRetry] = useState(0);
  const copy = mergePlatformAnalyticsCopy({ error: mergePlatformTrafficCopy(override).error });
  return <PlatformQueryBoundary key={`${enabled}:${days}:${retry}`} copy={copy} onRetry={() => setRetry((value) => value + 1)}><PlatformTrafficRead enabled={enabled} days={days} onDaysChange={setDays} copy={override} /></PlatformQueryBoundary>;
}
