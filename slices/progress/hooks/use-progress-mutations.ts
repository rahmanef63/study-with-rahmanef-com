"use client";
// progress slice — the mark-complete mutation hook (rr "Error handling": catch
// here, map ConvexError.code → copy, surface via sonner). Tracks its own
// pending flag for the button; Convex reactivity refreshes every progress query
// after the write, so no manual invalidation is needed.
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeProgressCopy, type ProgressCopyOverride } from "../config/copy";
import { progressErrorMessage } from "../lib/errors";
import type { MarkLessonCompleteResult } from "../types";

export function useMarkLessonComplete(copyOverride?: ProgressCopyOverride) {
  const copy = mergeProgressCopy(copyOverride);
  const markRaw = useMutation(api.features.progress.mutations.markLessonComplete);
  const [isPending, setIsPending] = useState(false);

  const markComplete = useCallback(
    async (lessonId: Id<"lessons">): Promise<MarkLessonCompleteResult | null> => {
      setIsPending(true);
      try {
        const result = (await markRaw({ lessonId })) as MarkLessonCompleteResult;
        if (!result.wasAlreadyComplete) {
          toast.success(
            result.courseCompleted ? copy.courseCompleteSuccess : copy.markCompleteSuccess
          );
        }
        return result;
      } catch (error) {
        toast.error(progressErrorMessage(error, copy));
        return null;
      } finally {
        setIsPending(false);
      }
    },
    [markRaw, copy]
  );

  return { markComplete, isPending };
}
