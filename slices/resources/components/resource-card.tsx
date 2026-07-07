// resources slice — one approved/own resource card. The link target is a
// USER-SUBMITTED external URL, so it is a plain <a target="_blank"> with
// noopener/noreferrer (next/link is for internal routes; the server already
// validated the URL is http(s)). Presentational + props-driven.
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResourcesCopy } from "../config/copy";
import { displayHost } from "../lib/url";
import { resourceStatusLabel, resourceStatusTone } from "../lib/status";
import type { ResourceCard as ResourceCardData } from "../types";
import { StatusBadge } from "./status-badge";

export type ResourceCardProps = {
  resource: ResourceCardData;
  copy: ResourcesCopy;
  /** Show the status chip (used on the "Kiriman saya" tab). */
  showStatus?: boolean;
};

export function ResourceCard({ resource, copy, showStatus = false }: ResourceCardProps) {
  const host = displayHost(resource.url);
  return (
    <Card className="h-full gap-4 rounded-[var(--radius-win)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent/30 hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base leading-snug">{resource.title}</CardTitle>
          {showStatus && (
            <StatusBadge
              label={resourceStatusLabel(resource.status, copy)}
              tone={resourceStatusTone(resource.status)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {resource.note && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{resource.note}</p>
        )}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <img
            src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
            alt=""
            width={16}
            height={16}
            loading="lazy"
            referrerPolicy="no-referrer"
            aria-hidden
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
            className="size-4 shrink-0 rounded-sm"
          />
          <span className="truncate">{host}</span>
          <ExternalLink className="size-3.5 shrink-0 opacity-60" aria-hidden />
          <span className="sr-only">{copy.openLink}</span>
        </a>
      </CardContent>
    </Card>
  );
}
