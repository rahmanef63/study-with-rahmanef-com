"use client";
// comments slice — one comment (live or deleted placeholder). Body renders as
// PLAIN TEXT with pre-wrap: no markdown/HTML interpretation of user input, so
// nothing user-authored can inject markup (defense-in-depth on top of server
// validation). TODO(rr): proposal — render bodyMd via a sanitized markdown
// read-surface (rr `markdown` slice) post-integration if alpha wants parity
// with lesson content.
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CommentsCopy } from "../config/copy";
import { formatRelativeTime } from "../lib/time";
import type { CommentItem as CommentItemData } from "../types";

export type CommentItemProps = {
  item: CommentItemData;
  /** Viewer may delete this comment (own, or instructor+) — UX gate only. */
  canDelete: boolean;
  onDelete: () => void;
  copy: CommentsCopy;
  actions?: React.ReactNode;
};

export function CommentItem({ item, canDelete, onDelete, copy, actions }: CommentItemProps) {
  if (item.deleted) {
    return (
      <p className="py-1 text-sm italic text-muted-foreground">{copy.deletedPlaceholder}</p>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm font-medium">
          {item.author?.displayName ?? copy.anonymousAuthor}
        </span>
        {item.author && (
          <span className="text-xs text-muted-foreground">@{item.author.username}</span>
        )}
        <span className="text-xs text-muted-foreground" title={new Date(item.createdAt).toLocaleString("id-ID")}>
          {formatRelativeTime(item.createdAt)}
        </span>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{item.bodyMd}</p>
      <div className="flex items-center gap-1">
        {actions}
        {canDelete && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" aria-hidden />
            {copy.delete}
          </Button>
        )}
      </div>
    </div>
  );
}
