"use client";
// resources slice — one pending resource in the instructor review queue, with
// Approve / Reject actions. The external URL is a plain <a target="_blank">
// (user-submitted; server-validated http(s)).
import { Check, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { ResourcesCopy } from "../config/copy";
import { displayHost } from "../lib/url";
import type { ResourceReviewItem } from "../types";

export type ResourceReviewRowProps = {
  item: ResourceReviewItem;
  // Return value ignored; a void return type still accepts a Promise-returning
  // handler.
  onApprove: () => void;
  onReject: () => void;
  pending: boolean;
  copy: ResourcesCopy;
};

export function ResourceReviewRow({
  item,
  onApprove,
  onReject,
  pending,
  copy,
}: ResourceReviewRowProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="truncate font-medium">{item.title}</p>
          {item.note && <p className="line-clamp-2 text-sm text-muted-foreground">{item.note}</p>}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="size-3" aria-hidden />
            {displayHost(item.url)}
          </a>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" onClick={() => onApprove()} disabled={pending}>
            <Check className="size-4" aria-hidden />
            {copy.approve}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onReject()} disabled={pending}>
            <X className="size-4" aria-hidden />
            {copy.reject}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
