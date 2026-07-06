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
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="line-clamp-2 text-base">{resource.title}</CardTitle>
          {showStatus && (
            <StatusBadge
              label={resourceStatusLabel(resource.status, copy)}
              tone={resourceStatusTone(resource.status)}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {resource.note && (
          <p className="line-clamp-3 text-sm text-muted-foreground">{resource.note}</p>
        )}
        <a
          href={resource.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          <span>{displayHost(resource.url)}</span>
          <span className="sr-only">{copy.openLink}</span>
        </a>
      </CardContent>
    </Card>
  );
}
