"use client";
// comments slice — one thread: root + depth-1 replies + inline reply form.
// The reply affordance is hidden on deleted roots (server also rejects, P0).
import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Id } from "@convex/_generated/dataModel";
import type { CommentsCopy } from "../config/copy";
import type { CommentThread as CommentThreadData } from "../lib/thread";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

export type CommentThreadProps = {
  thread: CommentThreadData;
  canModerate: boolean;
  onReply: (parentId: Id<"comments">, bodyMd: string) => Promise<boolean>;
  replying: boolean;
  onRequestDelete: (commentId: Id<"comments">) => void;
  copy: CommentsCopy;
};

export function CommentThread({
  thread,
  canModerate,
  onReply,
  replying,
  onRequestDelete,
  copy,
}: CommentThreadProps) {
  const [replyOpen, setReplyOpen] = useState(false);
  const { root, replies } = thread;

  return (
    <li className="space-y-3 rounded-[var(--radius-win)] border border-border bg-card p-4">
      <CommentItem
        item={root}
        canDelete={!root.deleted && (root.mine || canModerate)}
        onDelete={() => onRequestDelete(root._id)}
        copy={copy}
        actions={
          root.deleted ? undefined : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => setReplyOpen((v) => !v)}
            >
              <MessageSquare className="size-3.5" aria-hidden />
              {copy.reply}
            </Button>
          )
        }
      />

      {(replies.length > 0 || replyOpen) && (
        <div className="space-y-3 border-l-2 border-border pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply._id}
              item={reply}
              canDelete={!reply.deleted && (reply.mine || canModerate)}
              onDelete={() => onRequestDelete(reply._id)}
              copy={copy}
            />
          ))}
          {replyOpen && (
            <CommentForm
              onSubmit={(bodyMd) => onReply(root._id, bodyMd)}
              submitting={replying}
              copy={copy}
              placeholder={copy.replyPlaceholder}
              compact
              autoFocus
              onCancel={() => setReplyOpen(false)}
            />
          )}
        </div>
      )}
    </li>
  );
}
