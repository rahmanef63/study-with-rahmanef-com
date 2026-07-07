"use client";
// announcements slice — presentational card (props-driven, portable). Renders the
// body as plain text with preserved line breaks; full markdown rendering is a
// later adapt of the rr `markdown` slice (read surface only) — no raw HTML is
// injected, so this is XSS-safe by construction.
import { Megaphone } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/mockup-kit";
import { cn } from "@/lib/utils";
import { mergeAnnouncementsCopy, type AnnouncementsCopyOverride } from "../config/copy";
import type { AnnouncementView } from "../types";

/** Fresh window — a post from the last 3 days earns the "Baru" pill. Derived from
 *  the real createdAt (presentation only), never a stored/faked flag. */
const NEW_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

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
  const isNew = Date.now() - announcement.createdAt < NEW_WINDOW_MS;
  return (
    <Card
      className={cn(
        "w-full rounded-[var(--radius-win)] transition-colors hover:border-primary/30",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-[var(--radius-win)] bg-primary/10 text-primary"
          >
            <Megaphone className="size-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1.5">
            <CardTitle className="min-w-0 break-words text-lg">{announcement.title}</CardTitle>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <time
                dateTime={new Date(announcement.createdAt).toISOString()}
                title={formatDate(announcement.createdAt)}
                className="text-xs text-muted-foreground"
              >
                {relativeDate(announcement.createdAt)}
              </time>
              {isNew ? <Badge tone="accent">{t.newBadge}</Badge> : null}
              {announcement.postedToDiscord ? (
                <Badge tone="success">
                  <span aria-hidden className="mr-1.5 size-1.5 shrink-0 rounded-full bg-current opacity-70" />
                  {t.postedToDiscord}
                </Badge>
              ) : null}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">{announcement.bodyMd}</p>
      </CardContent>
    </Card>
  );
}
