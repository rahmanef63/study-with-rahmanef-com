"use client";
// resources slice — vote toggle hook (#18) with an optimistic patch of both
// suggestion list queries, so the button flips instantly (rr data-fetching:
// mutations via slice hooks). The patch only flips { voteCount, myVote } in
// place — no client-side re-sort, so cards don't jump mid-click; the server
// result re-sorts by voteCount on confirmation. Errors toast (rr error
// handling); success stays silent — the flipped button IS the feedback.
import { useMutation } from "convex/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { mergeResourcesCopy, type ResourcesCopyOverride } from "../config/copy";
import { resourcesErrorMessage } from "../lib/errors";
import type { SuggestionCardWithVotes } from "../types";

const LIST_QUERIES = [
  api.features.resources.queries.listOpenSuggestions,
  api.features.resources.queries.listMineSuggestions,
] as const;

/** Flip the caller's vote on one card; count never dips below zero. */
function flipVote(
  items: SuggestionCardWithVotes[],
  suggestionId: Id<"suggestions">
): SuggestionCardWithVotes[] {
  return items.map((s) =>
    s._id === suggestionId
      ? {
          ...s,
          myVote: !s.myVote,
          voteCount: Math.max(0, s.voteCount + (s.myVote ? -1 : 1)),
        }
      : s
  );
}

export function useToggleSuggestionVote(
  tenantId: Id<"tenants"> | undefined,
  copyOverride?: ResourcesCopyOverride
) {
  const copy = mergeResourcesCopy(copyOverride);
  // Casts below tolerate the committed loose api.d.ts (STATUS #3 note); the
  // shape is SSOT'd in convex/features/resources/projections.ts either way.
  const toggleRaw = useMutation(api.features.resources.votes.toggleVote).withOptimisticUpdate(
    (localStore, args) => {
      if (tenantId === undefined) return;
      for (const ref of LIST_QUERIES) {
        const current = localStore.getQuery(ref, { tenantId }) as
          | SuggestionCardWithVotes[]
          | undefined;
        if (current === undefined) continue;
        localStore.setQuery(
          ref,
          { tenantId },
          flipVote(current, args.suggestionId) as never
        );
      }
    }
  );
  const [isPending, setIsPending] = useState(false);

  const toggle = useCallback(
    async (suggestionId: Id<"suggestions">): Promise<boolean> => {
      setIsPending(true);
      try {
        await toggleRaw({ suggestionId });
        return true;
      } catch (error) {
        toast.error(resourcesErrorMessage(error, copy));
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [toggleRaw, copy]
  );

  return { toggle, isPending };
}
