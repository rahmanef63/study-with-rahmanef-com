"use client";
import { useState } from "react";
import { PlatformUsersDashboard } from "../components/platform-users-dashboard";
import { PlatformQueryBoundary } from "../components/platform-query-boundary";
import { usePlatformUsers } from "../hooks/use-platform-users";
import { mergePlatformAnalyticsCopy } from "../config/platform-copy";
import { mergePlatformUsersCopy, type PlatformUsersCopyOverride } from "../config/users-copy";
import type { PlatformUserData } from "../types";

export type PlatformUsersViewProps = { enabled: boolean; detailHref: (userId: PlatformUserData["userId"]) => string; copy?: PlatformUsersCopyOverride };
function UsersRead({ enabled, search, onSearchChange, detailHref, copy: override }: PlatformUsersViewProps & { search: string; onSearchChange: (search: string) => void }) {
  const { results, status, loadMore } = usePlatformUsers({ enabled, search });
  if (!enabled) return null;
  return <PlatformUsersDashboard rows={results} status={status} search={search} onSearchChange={onSearchChange} onLoadMore={() => loadMore(20)} detailHref={detailHref} copy={override} />;
}
export function PlatformUsersView({ enabled, detailHref, copy: override }: PlatformUsersViewProps) {
  const [search, setSearch] = useState("");
  const [retry, setRetry] = useState(0);
  const copy = mergePlatformUsersCopy(override);
  const boundaryCopy = mergePlatformAnalyticsCopy({ error: copy.error, denied: copy.denied, recovery: copy.retry });
  return <PlatformQueryBoundary key={`${enabled}:${retry}`} copy={boundaryCopy} onRetry={() => setRetry((value) => value + 1)}><UsersRead enabled={enabled} search={search} onSearchChange={setSearch} detailHref={detailHref} copy={override} /></PlatformQueryBoundary>;
}
