"use client";
// posts slice — like state for one rendered feed page.
//
// myLikedPostIds is NOT an etalase surface: an anonymous reader sees counts but
// never a like state, so the query is skipped until the viewer is a member. The
// ids come back as a plain array; a Set keeps the per-card lookup O(1) while a
// feed page re-renders on every socket tick.
import { useQuery } from "convex/react";
import { useMemo } from "react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

/**
 * @param postIds the ids currently on screen (bounded by the page size — the
 *   server clamps anything longer).
 * @param enabled viewer is a member; false keeps the query on "skip".
 */
export function useMyLikedPostIds(
  postIds: Id<"posts">[],
  enabled: boolean
): Set<Id<"posts">> {
  // Re-keying the query on every render would resubscribe on each socket tick;
  // the join pins the args to the actual page contents instead.
  const key = postIds.join(",");
  const args = useMemo(
    () => (enabled && postIds.length > 0 ? { postIds } : ("skip" as const)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` IS postIds
    [key, enabled]
  );
  const liked = useQuery(api.features.posts.likes.myLikedPostIds, args);
  return useMemo(() => new Set(liked ?? []), [liked]);
}
