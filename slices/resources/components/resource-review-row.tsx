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
            className="inline-flex max-w-full items-center gap-1.5 rounded-sm text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img
              src={`https://www.google.com/s2/favicons?domain=${displayHost(item.url)}&sz=64`}
              alt=""
              width={14}
              height={14}
              loading="lazy"
              referrerPolicy="no-referrer"
              aria-hidden
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
              className="size-3.5 shrink-0 rounded-sm"
            />
            <span className="truncate">{displayHost(item.url)}</span>
            <ExternalLink className="size-3 shrink-0 opacity-60" aria-hidden />
          </a>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <Button
            size="sm"
            onClick={() => onApprove()}
            disabled={pending}
            className="min-h-11 flex-1 sm:flex-none"
          >
            <Check className="size-4" aria-hidden />
            {copy.approve}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onReject()}
            disabled={pending}
            className="min-h-11 flex-1 sm:flex-none"
          >
            <X className="size-4" aria-hidden />
            {copy.reject}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
