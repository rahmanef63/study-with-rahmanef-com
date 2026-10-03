"use client";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { PlatformUserDetail } from "../components/platform-user-detail";
import { PlatformQueryBoundary } from "../components/platform-query-boundary";
import { usePlatformUserDetail } from "../hooks/use-platform-users";
import { mergePlatformAnalyticsCopy } from "../config/platform-copy";
import { mergePlatformUsersCopy, type PlatformUsersCopyOverride } from "../config/users-copy";

export type PlatformUserDetailViewProps = { enabled: boolean; userId: Id<"users">; geoAttributionHref: string; copy?: PlatformUsersCopyOverride };
function DetailRead({ enabled, userId, geoAttributionHref, copy: override }: PlatformUserDetailViewProps) {
  const data = usePlatformUserDetail({ enabled, userId });
  const copy = mergePlatformUsersCopy(override);
  if (!enabled) return null;
  if (data === undefined) return <div role="status" className="space-y-3"><p className="text-sm text-muted-foreground">{copy.loading}</p><Skeleton className="h-48 w-full" /><Skeleton className="h-64 w-full" /></div>;
  if (data === null) return <p role="status" className="py-8 text-muted-foreground">{copy.noUser}</p>;
  return <PlatformUserDetail data={data} geoAttributionHref={geoAttributionHref} copy={override} />;
}
export function PlatformUserDetailView(props: PlatformUserDetailViewProps) {
  const [retry, setRetry] = useState(0);
  const copy = mergePlatformUsersCopy(props.copy);
  const boundaryCopy = mergePlatformAnalyticsCopy({ error: copy.error, denied: copy.denied, recovery: copy.retry });
  return <PlatformQueryBoundary key={`${props.enabled}:${props.userId}:${retry}`} copy={boundaryCopy} onRetry={() => setRetry((value) => value + 1)}><DetailRead {...props} /></PlatformQueryBoundary>;
}
