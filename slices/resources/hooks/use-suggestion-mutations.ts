"use client";
// resources slice — suggestion write hooks (rr "Error handling": catch here,
// map ConvexError.code → copy, toast via sonner).
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeResourcesCopy, type ResourcesCopyOverride } from "../config/copy";
import { resourcesErrorMessage } from "../lib/errors";
import type { SuggestionStatus } from "../types";

export type SubmitSuggestionInput = {
  tenantId: Id<"tenants">;
  title: string;
  detail?: string;
};

export function useSubmitSuggestion(copyOverride?: ResourcesCopyOverride) {
  const copy = mergeResourcesCopy(copyOverride);
  const submitRaw = useMutation(api.features.resources.suggestions.submit);
  const [isPending, setIsPending] = useState(false);

  const submit = useCallback(
    async (input: SubmitSuggestionInput): Promise<boolean> => {
      setIsPending(true);
      try {
        await submitRaw(input);
        toast.success(copy.submitSuggestionSuccess);
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

export function useSetSuggestionStatus(copyOverride?: ResourcesCopyOverride) {
  const copy = mergeResourcesCopy(copyOverride);
  const setStatusRaw = useMutation(api.features.resources.suggestions.setStatus);
  const [isPending, setIsPending] = useState(false);

  const setStatus = useCallback(
    async (suggestionId: Id<"suggestions">, status: SuggestionStatus): Promise<boolean> => {
      setIsPending(true);
      try {
        await setStatusRaw({ suggestionId, status });
        toast.success(copy.statusUpdateSuccess);
        return true;
      } catch (error) {
        toast.error(resourcesErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [setStatusRaw, copy]
  );

  return { setStatus, isPending };
}
