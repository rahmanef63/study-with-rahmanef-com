"use client";
// comments slice — LessonComments({ lessonId }): the barrel view alpha mounts
// under the lesson content in the lesson window-app (#16). Self-contained:
// reads via useLessonComments (canModerate comes from the query — no extra
// props needed), writes via the mutation hooks, delete confirmed on
// ResponsiveDialog. Security lives server-side; every gate here is UX only.
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCommentsCopy, type CommentsCopyOverride } from "../config/copy";
import { buildThread } from "../lib/thread";
import { useLessonComments } from "../hooks/use-lesson-comments";
import { useAddComment, useDeleteComment } from "../hooks/use-comment-mutations";
import { CommentForm } from "../components/comment-form";
import { CommentThread } from "../components/comment-thread";
import { CommentsEmptyState } from "../components/comments-empty-state";
import { DeleteCommentDialog } from "../components/delete-comment-dialog";

export type LessonCommentsProps = {
  lessonId: Id<"lessons">;
  copy?: CommentsCopyOverride;
  className?: string;
};

export function LessonComments({ lessonId, copy: copyOverride, className }: LessonCommentsProps) {
  const copy = mergeCommentsCopy(copyOverride);
  const data = useLessonComments(lessonId);
  const { add, isPending: adding } = useAddComment(copyOverride);
  const { softDelete, isPending: deleting } = useDeleteComment(copyOverride);
  const [deleteTarget, setDeleteTarget] = useState<Id<"comments"> | null>(null);

  const threads = data ? buildThread(data.items) : undefined;

  return (
    <section className={className ? `space-y-5 ${className}` : "space-y-5"}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{copy.sectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{copy.sectionSubtitle}</p>
      </div>

      <CommentForm
        onSubmit={(bodyMd) => add({ lessonId, bodyMd })}
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
              onReply={(parentId, bodyMd) => add({ lessonId, bodyMd, parentId })}
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
