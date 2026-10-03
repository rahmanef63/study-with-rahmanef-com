"use client";
import type { PlatformUserDetailData } from "../types";
import { mergePlatformUsersCopy, type PlatformUsersCopyOverride } from "../config/users-copy";
import { userCount, userLocation, userSource, userStatus, userTime } from "../lib/users-format";
import { PlatformUserLearning } from "./platform-user-learning";
import { PlatformUserActivity } from "./platform-user-activity";

export type PlatformUserDetailProps = { data: PlatformUserDetailData; geoAttributionHref: string; copy?: PlatformUsersCopyOverride };
export function PlatformUserDetail({ data, geoAttributionHref, copy: override }: PlatformUserDetailProps) {
  const copy = mergePlatformUsersCopy(override);
  const { user } = data;
  const facts = [
    [copy.username, user.username ? `@${user.username}` : copy.noProfile], [copy.email, user.email ?? copy.unknown],
    [copy.role, user.isPlatformAdmin === null ? copy.unknownRole : user.isPlatformAdmin ? copy.platformAdmin : copy.normalUser], [copy.accountCreated, userTime(user.joinedAt, copy)],
    [copy.latest, userTime(user.lastLearningAt, copy)], [copy.location, userLocation(user.latestVisit, copy)], [copy.source, userSource(user.latestVisit, copy)],
  ];
  const learning = [
    [copy.communities, user.memberships], [copy.reads, user.reads], [copy.completed, user.lessonsCompleted], [copy.badges, user.badges], [copy.quizzes, user.quizAttempts],
  ] as const;
  return <div className="min-w-0 space-y-7">
    {!data.complete ? <p role="status" className="border-l-4 border-primary px-4 py-3 text-sm">{copy.capped}</p> : null}
    <section aria-label={copy.profile} className="space-y-4">
      <div><h2 className="break-words text-xl font-semibold">{user.displayName}</h2><p className="mt-1 text-sm text-muted-foreground">{userStatus(user.status, copy)}</p></div>
      <dl className="grid gap-x-8 gap-y-4 border-y border-border py-4 sm:grid-cols-2 xl:grid-cols-3">{facts.map(([label, value]) => <div key={label} className="min-w-0"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 break-words text-sm">{value}</dd></div>)}</dl>
      <details><summary className="min-h-11 cursor-pointer py-3 text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">{copy.accountId}</summary><code className="block break-all text-xs">{user.userId}</code></details>
    </section>
    <section aria-label={copy.learning}><dl className="grid grid-cols-2 gap-4 border-y border-border py-4 sm:grid-cols-3 xl:grid-cols-5">{learning.map(([label, count]) => <div key={label} className="min-w-0"><dt className="break-words text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums">{userCount(count)}</dd></div>)}</dl></section>
    <PlatformUserLearning data={data} copy={copy} />
    <PlatformUserActivity activity={data.activity} complete={data.activityComplete} copy={copy} />
    <details className="border-t border-border pt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-ring">{copy.privacy}</summary><div className="space-y-3 pt-3 text-sm text-muted-foreground"><p>{copy.privacyNote}</p><p>{copy.geoNote} <a className="text-primary underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring" href={geoAttributionHref} target="_blank" rel="noopener noreferrer">{copy.geoAttribution}</a>.</p><p>{copy.recentLimit}</p></div></details>
  </div>;
}
