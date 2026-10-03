"use client";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PlatformUsersTable } from "./platform-users-table";
import { mergePlatformUsersCopy, type PlatformUsersCopyOverride } from "../config/users-copy";
import type { PlatformUserData } from "../types";

export type PlatformUsersDashboardProps = {
  rows: PlatformUserData[]; search: string; onSearchChange: (search: string) => void;
  status: "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";
  onLoadMore: () => void; detailHref: (userId: PlatformUserData["userId"]) => string; copy?: PlatformUsersCopyOverride;
};
export function PlatformUsersDashboard({ rows, search, onSearchChange, status, onLoadMore, detailHref, copy: override }: PlatformUsersDashboardProps) {
  const id = useId();
  const copy = mergePlatformUsersCopy(override);
  const incomplete = rows.some((row) => [row.memberships, row.reads, row.lessonsCompleted, row.badges, row.quizAttempts].some((count) => !count.exact));
  return <div className="min-w-0 space-y-5">
    <div className="max-w-xl space-y-2"><label className="text-sm font-medium" htmlFor={id}>{copy.search}</label><Input id={id} type="search" value={search} maxLength={100} onChange={(event) => onSearchChange(event.target.value)} aria-describedby={`${id}-hint`} className="min-h-11" /><p id={`${id}-hint`} className="text-xs text-muted-foreground">{copy.searchHint}</p></div>
    {status === "LoadingFirstPage" ? <div role="status" className="space-y-3"><p className="text-sm text-muted-foreground">{copy.loading}</p><Skeleton className="h-64 w-full" /></div> : <>
      {incomplete ? <p role="status" className="border-l-4 border-primary px-4 py-3 text-sm">{copy.capped}</p> : null}
      <PlatformUsersTable rows={rows} detailHref={detailHref} copy={copy} />
      <div className="flex flex-wrap items-center gap-3">{status === "Exhausted" ? <p className="text-sm text-muted-foreground">{copy.exhausted}</p> : <Button variant="outline" className="min-h-11" disabled={status !== "CanLoadMore"} onClick={onLoadMore}>{status === "LoadingMore" ? copy.loadingMore : copy.more}</Button>}</div>
    </>}
    <p className="text-sm text-muted-foreground">{copy.trackingNote}</p>
  </div>;
}
