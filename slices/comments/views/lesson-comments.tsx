"use client";
// comments slice — the ONE thread view. Mounted under the lesson content in the
// lesson surface (#16) and, since v1.8 #29, under a Diskusi post permalink:
// exactly one of `lessonId` / `postId` is passed and the view swaps the read
// index (listByLesson ⇄ listByPost) — same projection, same placeholder
// contract, so the thread UI is never forked.
//
// Self-contained: canModerate comes from the query (no extra props), writes go
// through the mutation hooks, delete is confirmed on ResponsiveDialog. Security
// lives server-side; every gate here is UX only.
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCommentsCopy, type CommentsCopyOverride } from "../config/copy";
import { buildThread } from "../lib/thread";
import { useLessonComments, usePostComments } from "../hooks/use-lesson-comments";
import { useAddComment, useDeleteComment } from "../hooks/use-comment-mutations";
import { CommentForm } from "../components/comment-form";
import { CommentThread } from "../components/comment-thread";
import { CommentsEmptyState } from "../components/comments-empty-state";
import { DeleteCommentDialog } from "../components/delete-comment-dialog";

/** EXACTLY ONE target — the union mirrors the mutation's XOR invariant. */
type CommentsTarget =
  | { lessonId: Id<"lessons">; postId?: never }
  | { postId: Id<"posts">; lessonId?: never };

export type LessonCommentsProps = CommentsTarget & {
  copy?: CommentsCopyOverride;
  className?: string;
};

export function LessonComments({
  lessonId,
  postId,
  copy: copyOverride,
  className,
}: LessonCommentsProps) {
  const copy = mergeCommentsCopy(copyOverride);
  // Both hooks always run (rules of hooks); the one without an id stays on
  // "skip", so exactly one subscription is ever open.
  const lessonData = useLessonComments(lessonId);
  const postData = usePostComments(postId);
  const data = postId ? postData : lessonData;

  const { add, isPending: adding } = useAddComment(copyOverride);
  const { softDelete, isPending: deleting } = useDeleteComment(copyOverride);
  const [deleteTarget, setDeleteTarget] = useState<Id<"comments"> | null>(null);

  const threads = data ? buildThread(data.items) : undefined;
  const target: CommentsTarget = postId ? { postId } : { lessonId: lessonId as Id<"lessons"> };

  return (
    <section className={className ? `space-y-5 ${className}` : "space-y-5"}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{copy.sectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{copy.sectionSubtitle}</p>
      </div>

      <CommentForm
        onSubmit={(bodyMd) => add({ ...target, bodyMd })}
        submitting={adding}
        copy={copy}
      />

      {threads === undefined ? (
        <div className="space-y-3" aria-busy>
          <Skeleton className="h-20 w-full rounded-[var(--radius-win)]" />
          <Skeleton className="h-20 w-full rounded-[var(--radius-win)]" />
        </div>
      ) : threads.length === 0 ? (
        <CommentsEmptyState title={copy.emptyTitle} hint={copy.emptyHint} />
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => (
            <CommentThread
              key={thread.root._id}
              thread={thread}
              canModerate={data?.canModerate ?? false}
              onReply={(parentId, bodyMd) => add({ ...target, bodyMd, parentId })}
              replying={adding}
              onRequestDelete={setDeleteTarget}
              copy={copy}
            />
          ))}
        </ul>
      )}

      <DeleteCommentDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={async () => {
          if (deleteTarget !== null) await softDelete(deleteTarget);
        }}
        pending={deleting}
        copy={copy}
      />
    </section>
  );
}
