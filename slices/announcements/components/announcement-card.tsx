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

export function AnnouncementCard({ announcement, copy, className }: AnnouncementCardProps) {
  const t = mergeAnnouncementsCopy(copy);
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">{announcement.title}</CardTitle>
        <p className="text-muted-foreground text-xs">
          {formatDate(announcement.createdAt)}
          {announcement.postedToDiscord ? ` · ${t.postedToDiscord}` : ""}
        </p>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{announcement.bodyMd}</p>
      </CardContent>
    </Card>
  );
}
