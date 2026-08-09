"use client";
// posts slice — reactive feed read (rr "Data fetching": useQuery /
// usePaginatedQuery from convex/react; never fetch in useEffect).
//
// publicListFeed is ANONYMOUS, so this hook runs for logged-out readers too —
// that is the point of #29. `kind: null` means "Semua": the arg is OMITTED
// rather than sent as undefined, so the server sees the unfiltered range.
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { FEED_PAGE_SIZE } from "../config/limits";
import type { MinePost, PostKindFilter, PublicPost } from "../types";

export type PostFeedStatus = "LoadingFirstPage" | "CanLoadMore" | "LoadingMore" | "Exhausted";

export type PostFeed = {
  posts: PublicPost[];
  status: PostFeedStatus;
  isLoading: boolean;
  loadMore: (numItems: number) => void;
};

export function usePostFeed(
  tenantId: Id<"tenants">,
  kind: PostKindFilter = null,
  pageSize: number = FEED_PAGE_SIZE
): PostFeed {
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.features.posts.queries.publicListFeed,
    kind === null ? { tenantId } : { tenantId, kind },
    { initialNumItems: pageSize }
  );
  return { posts: results, status, isLoading, loadMore };
}

/**
 * The caller's OWN posts in this community — MEMBER+, so it is SKIPPED while
 * anonymous (calling it logged-out would throw NOT_AUTHENTICATED into the error
 * boundary instead of letting the page render its join CTA).
 */
export function useMyPosts(
  tenantId: Id<"tenants"> | undefined,
  enabled: boolean
): MinePost[] | undefined {
  return useQuery(
    api.features.posts.queries.listMine,
    enabled && tenantId !== undefined ? { tenantId } : "skip"
  );
}
