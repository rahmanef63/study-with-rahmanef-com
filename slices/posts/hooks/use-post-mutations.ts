"use client";
// posts slice — write hooks (rr "Error handling": catch here, map
// ConvexError.code → copy, toast via sonner). Every gate below is UX; the
// mutation re-checks role, ownership and the daily cap server-side (P0).
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergePostsCopy, type PostsCopyOverride } from "../config/copy";
import { postsErrorMessage } from "../lib/errors";
import type { PostKind } from "../types";

export type CreatePostInput = {
  tenantId: Id<"tenants">;
  kind: PostKind;
  title: string;
  bodyMd: string;
  /** Omit or "" for none — the server treats "" as "clear". */
  linkUrl?: string;
  /** The 11-char id, never a full URL. */
  youtubeVideoId?: string;
};

export function useCreatePost(copyOverride?: PostsCopyOverride) {
  const copy = mergePostsCopy(copyOverride);
  const createRaw = useMutation(api.features.posts.posts.create);
  const [isPending, setIsPending] = useState(false);

  const create = useCallback(
    async (input: CreatePostInput): Promise<boolean> => {
      setIsPending(true);
      try {
        await createRaw(input);
        toast.success(copy.createSuccess);
        return true;
      } catch (error) {
        // RATE_LIMITED lands here as the server's own Bahasa sentence ("Maksimal
        // 10 post per hari…"), never as a raw code — see lib/errors.ts.
        toast.error(postsErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [createRaw, copy]
  );

  return { create, isPending };
}

/**
 * Idempotent like toggle. The Convex socket pushes the new likeCount back into
 * every mounted feed query, so there is no local counter to keep in sync —
 * the only local state is "a request is in flight".
 */
export function useToggleLike(copyOverride?: PostsCopyOverride) {
  const copy = mergePostsCopy(copyOverride);
  const toggleRaw = useMutation(api.features.posts.likes.toggleLike);
  const [pendingId, setPendingId] = useState<Id<"posts"> | null>(null);

  const toggleLike = useCallback(
    async (postId: Id<"posts">): Promise<boolean> => {
      setPendingId(postId);
      try {
        await toggleRaw({ postId });
        return true;
      } catch (error) {
        toast.error(postsErrorMessage(error, copy));
        return false;
      } finally {
        setPendingId(null);
      }
    },
    [toggleRaw, copy]
  );

  return { toggleLike, pendingId };
}
