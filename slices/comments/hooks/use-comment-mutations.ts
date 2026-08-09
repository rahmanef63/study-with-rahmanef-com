"use client";
// comments slice — write hooks (rr "Error handling": catch here, map
// ConvexError.code → copy, toast via sonner).
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeCommentsCopy, type CommentsCopyOverride } from "../config/copy";
import { commentsErrorMessage } from "../lib/errors";

/**
 * EXACTLY ONE of lessonId / postId (v1.8 #29). The XOR cannot be expressed in
 * the Convex validator, so the mutation asserts it (VALIDATION_FAILED) and the
 * union below keeps a caller from passing both by accident.
 */
export type AddCommentInput = {
  bodyMd: string;
  parentId?: Id<"comments">;
} & (
  | { lessonId: Id<"lessons">; postId?: never }
  | { postId: Id<"posts">; lessonId?: never }
);

export function useAddComment(copyOverride?: CommentsCopyOverride) {
  const copy = mergeCommentsCopy(copyOverride);
  const addRaw = useMutation(api.features.comments.comments.addComment);
  const [isPending, setIsPending] = useState(false);

  const add = useCallback(
    async (input: AddCommentInput): Promise<boolean> => {
      setIsPending(true);
      try {
        await addRaw(input);
        toast.success(copy.addSuccess);
        return true;
      } catch (error) {
        toast.error(commentsErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [addRaw, copy]
  );

  return { add, isPending };
}

export function useDeleteComment(copyOverride?: CommentsCopyOverride) {
  const copy = mergeCommentsCopy(copyOverride);
  const deleteRaw = useMutation(api.features.comments.comments.softDelete);
  const [isPending, setIsPending] = useState(false);

  const softDelete = useCallback(
    async (commentId: Id<"comments">): Promise<boolean> => {
      setIsPending(true);
      try {
        await deleteRaw({ commentId });
        toast.success(copy.deleteSuccess);
        return true;
      } catch (error) {
        toast.error(commentsErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [deleteRaw, copy]
  );

  return { softDelete, isPending };
}
