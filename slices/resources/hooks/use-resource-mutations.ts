"use client";
// resources slice — resource write hooks (rr "Error handling": catch here, map
// ConvexError.code → copy, toast via sonner). Convex reactivity refreshes every
// resource query after a write, so no manual invalidation.
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeResourcesCopy, type ResourcesCopyOverride } from "../config/copy";
import { resourcesErrorMessage } from "../lib/errors";

export type SubmitResourceInput = {
  tenantId: Id<"tenants">;
  title: string;
  url: string;
  note?: string;
  courseId?: Id<"courses">;
};

export function useSubmitResource(copyOverride?: ResourcesCopyOverride) {
  const copy = mergeResourcesCopy(copyOverride);
  const submitRaw = useMutation(api.features.resources.resources.submit);
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (input: SubmitResourceInput): Promise<boolean> => {
      setIsPending(true);
      try {
        await submitRaw(input);
        toast.success(copy.submitResourceSuccess);
        return true;
      } catch (error) {
        toast.error(resourcesErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [submitRaw, copy]
  );

  return { submit, isPending };
}

export function useCurateResource(copyOverride?: ResourcesCopyOverride) {
  const copy = mergeResourcesCopy(copyOverride);
  const curateRaw = useMutation(api.features.resources.resources.curate);
  const [isPending, setIsPending] = useState(false);

  const curate = useCallback(
    async (
      resourceId: Id<"resources">,
      decision: "approved" | "rejected"
    ): Promise<boolean> => {
      setIsPending(true);
      try {
        await curateRaw({ resourceId, decision });
        toast.success(decision === "approved" ? copy.approveSuccess : copy.rejectSuccess);
        return true;
      } catch (error) {
        toast.error(resourcesErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [curateRaw, copy]
  );

  return { curate, isPending };
}
