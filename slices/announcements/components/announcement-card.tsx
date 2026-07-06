"use client";
// announcements slice — presentational card (props-driven, portable). Renders the
// body as plain text with preserved line breaks; full markdown rendering is a
// later adapt of the rr `markdown` slice (read surface only) — no raw HTML is
// injected, so this is XSS-safe by construction.
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { mergeAnnouncementsCopy, type AnnouncementsCopyOverride } from "../config/copy";
import type { AnnouncementView } from "../types";

export type AnnouncementCardProps = {
  announcement: AnnouncementView;
  copy?: AnnouncementsCopyOverride;
  className?: string;
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Human-friendly "2 hari yang lalu" from a timestamp — picks the coarsest unit
 * that still reads naturally. Uses the platform Intl formatter (no date lib).
 */
function relativeDate(ms: number): string {
  const diff = ms - Date.now(); // negative → in the past
  const abs = Math.abs(diff);
  const minute = 60_000;
  if (abs < minute) return "baru saja";
  const rtf = new Intl.RelativeTimeFormat("id", { numeric: "auto" });
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;
  if (abs < hour) return rtf.format(Math.round(diff / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diff / hour), "hour");
  if (abs < week) return rtf.format(Math.round(diff / day), "day");
  if (abs < month) return rtf.format(Math.round(diff / week), "week");
  if (abs < year) return rtf.format(Math.round(diff / month), "month");
  return rtf.format(Math.round(diff / year), "year");
}

export function AnnouncementCard({ announcement, copy, className }: AnnouncementCardProps) {
  const t = mergeAnnouncementsCopy(copy);
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{announcement.title}</CardTitle>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <time
            dateTime={new Date(announcement.createdAt).toISOString()}
            title={formatDate(announcement.createdAt)}
            className="text-muted-foreground text-xs"
          >
            {relativeDate(announcement.createdAt)}
          </time>
          {announcement.postedToDiscord ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-2 py-0.5 text-muted-foreground text-[11px] font-medium">
              <span aria-hidden className="size-1.5 rounded-full bg-primary/70" />
              {t.postedToDiscord}
            </span>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.bodyMd}</p>
      </CardContent>
    </Card>
  );
}
