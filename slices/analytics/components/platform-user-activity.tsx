"use client";
import type { PlatformUserActivity } from "../types";
import type { PlatformUsersCopy } from "../config/users-copy";
import { userLocation, userTime } from "../lib/users-format";

export function PlatformUserActivity({ activity, complete, copy }: { activity: PlatformUserActivity[]; complete: boolean; copy: PlatformUsersCopy }) {
  return <section aria-label={copy.traffic} className="min-w-0 space-y-3 border-t border-border pt-6">
    <h2 className="text-lg font-semibold">{copy.traffic}</h2><p className="text-sm text-muted-foreground">{copy.trackingNote}</p>
    {!complete ? <p role="status" className="border-l-4 border-primary px-4 py-3 text-sm">{copy.capped}</p> : null}
    {activity.length === 0 ? <p className="py-4 text-sm text-muted-foreground">{copy.noVisits}</p> : <>
      <p className="text-xs text-muted-foreground">{copy.scroll}</p>
      <div role="region" aria-label={copy.traffic} tabIndex={0} className="max-h-[32rem] min-w-0 overflow-auto border-y border-border focus-visible:outline-2 focus-visible:outline-ring">
        <table className="w-full min-w-[78rem] text-left text-sm"><caption className="sr-only">{copy.traffic}</caption><thead className="sticky top-0 z-10 bg-background"><tr>{[copy.date, copy.kind, copy.from, copy.target, copy.referrer, copy.source, copy.campaign, copy.location, copy.device, copy.browser].map((label) => <th key={label} scope="col" className="border-b border-border px-3 py-3 font-medium text-muted-foreground">{label}</th>)}</tr></thead>
          <tbody>{activity.map((event, index) => <tr key={`${event.at}:${index}`} className="border-b border-border/60 last:border-0">
            <td className="whitespace-nowrap px-3 py-3"><time dateTime={new Date(event.at).toISOString()}>{userTime(event.at, copy)}</time></td><td className="px-3 py-3">{event.kind === "click" ? copy.click : copy.page}</td>
            <td className="max-w-72 break-words px-3 py-3"><code className="text-xs">{event.path}</code></td><td className="max-w-72 break-words px-3 py-3"><code className="text-xs">{event.target ?? "—"}</code></td>
            <td className="max-w-48 break-words px-3 py-3">{event.referrerHost || copy.directOrUnknown}</td><td className="max-w-44 break-words px-3 py-3">{event.utmSource || copy.unknown}</td><td className="max-w-44 break-words px-3 py-3">{event.utmCampaign || copy.unknown}</td><td className="max-w-48 break-words px-3 py-3">{userLocation(event, copy)}</td><td className="px-3 py-3">{event.viewport === "unknown" ? copy.unknown : event.viewport}</td><td className="max-w-48 break-words px-3 py-3">{[event.browser, event.os].filter(Boolean).join(" / ") || copy.unknown}</td>
          </tr>)}</tbody>
        </table>
      </div>
    </>}
  </section>;
}
