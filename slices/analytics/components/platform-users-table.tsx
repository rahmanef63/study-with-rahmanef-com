"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { PlatformUserData } from "../types";
import type { PlatformUsersCopy } from "../config/users-copy";
import { downloadAggregateCsv, type AggregateColumn } from "../lib/platform-format";
import { userCount, userLocation, userSource, userStatus, userTime } from "../lib/users-format";

export type PlatformUsersTableProps = { rows: PlatformUserData[]; detailHref: (userId: PlatformUserData["userId"]) => string; copy: PlatformUsersCopy };
export function PlatformUsersTable({ rows, detailHref, copy }: PlatformUsersTableProps) {
  const columns: AggregateColumn<PlatformUserData>[] = [
    { key: "id", label: copy.accountId, value: (row) => row.userId },
    { key: "name", label: copy.identity, value: (row) => row.displayName },
    { key: "username", label: copy.username, value: (row) => row.username },
    { key: "email", label: copy.email, value: (row) => row.email },
    { key: "learning", label: copy.learning, value: (row) => userStatus(row.status, copy) },
    { key: "memberships", label: copy.communities, value: (row) => userCount(row.memberships) },
    { key: "reads", label: copy.reads, value: (row) => userCount(row.reads) },
    { key: "completed", label: copy.completed, value: (row) => userCount(row.lessonsCompleted) },
    { key: "badges", label: copy.badges, value: (row) => userCount(row.badges) },
    { key: "quizzes", label: copy.quizzes, value: (row) => userCount(row.quizAttempts) },
    { key: "latest", label: copy.latest, value: (row) => userTime(row.lastLearningAt, copy) },
    { key: "location", label: copy.location, value: (row) => userLocation(row.latestVisit, copy) },
    { key: "source", label: copy.source, value: (row) => userSource(row.latestVisit, copy) },
  ];
  return <section aria-label={copy.list} className="min-w-0 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{rows.length} {copy.rows}</p><Button variant="outline" className="min-h-11" disabled={rows.length === 0} onClick={() => downloadAggregateCsv("study-pengguna.csv", rows, columns)}>{copy.export}</Button></div>
    {rows.length === 0 ? <p className="border-y border-border py-8 text-sm text-muted-foreground">{copy.empty}</p> : <>
      <p className="text-xs text-muted-foreground">{copy.scroll}</p>
      <div role="region" aria-label={copy.list} tabIndex={0} className="max-h-[36rem] min-w-0 overflow-auto border-y border-border focus-visible:outline-2 focus-visible:outline-ring">
        <table className="w-full min-w-[76rem] text-left text-sm"><caption className="sr-only">{copy.list}</caption>
          <thead className="sticky top-0 z-10 bg-background"><tr>{[copy.identity, copy.learning, copy.location, copy.source, copy.latest, copy.communities, copy.reads, copy.completed, copy.badges, copy.quizzes].map((label) => <th key={label} scope="col" className="border-b border-border px-3 py-3 font-medium text-muted-foreground">{label}</th>)}</tr></thead>
          <tbody>{rows.map((row) => <tr key={row.userId} className="border-b border-border/60 last:border-0">
            <td className="min-w-56 max-w-80 break-words px-3 py-3"><Link href={detailHref(row.userId)} className="block min-h-11 max-w-64 break-words py-3 font-medium text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring">{row.displayName}</Link><p className="text-xs text-muted-foreground">{row.username ? `@${row.username}` : copy.noProfile}</p><p className="text-xs text-muted-foreground">{row.email ?? copy.unknown}</p>{row.isPlatformAdmin ? <p className="mt-1 text-xs">{copy.platformAdmin}</p> : null}</td>
            <td className="px-3 py-3">{userStatus(row.status, copy)}</td>
            <td className="max-w-52 break-words px-3 py-3">{userLocation(row.latestVisit, copy)}</td><td className="max-w-52 break-words px-3 py-3">{userSource(row.latestVisit, copy)}</td><td className="whitespace-nowrap px-3 py-3">{userTime(row.lastLearningAt, copy)}</td>
            {[row.memberships, row.reads, row.lessonsCompleted, row.badges, row.quizAttempts].map((count, index) => <td key={index} className="px-3 py-3 tabular-nums">{userCount(count)}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </section>;
}
