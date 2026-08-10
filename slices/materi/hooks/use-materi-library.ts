"use client";
// materi slice — the library reads (rr "Data fetching": useQuery /
// usePaginatedQuery from convex/react; never fetch in useEffect).
//
// BOTH queries are MEMBER+ — there is no anonymous library, because a list of
// every materi in a community is exactly what membership buys. So both take an
// `enabled` flag and pass "skip" when it is false: calling them logged-out
// would throw NOT_AUTHORIZED straight into the error boundary instead of
// letting the page render its join CTA.
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { LIBRARY_PAGE_SIZE } from "../config/limits";
import type { MateriCard, TagCount } from "../types";

export type MateriLibraryStatus =
  | "LoadingFirstPage"
  | "CanLoadMore"
  | "LoadingMore"
  | "Exhausted";

export type MateriLibrary = {
  materi: MateriCard[];
  status: MateriLibraryStatus;
  isLoading: boolean;
  loadMore: (numItems: number) => void;
};

/**
 * Paginated materi library, newest first, optionally narrowed to one tag.
 *
 * `tag === null` means "Semua": the arg is OMITTED rather than sent as
 * undefined, so the server walks the unfiltered index range.
 *
 * A TAGGED page can come back shorter than the page size while `isDone` is
 * still false — the server post-filters rows the viewer may not see. That is
 * normal Convex pagination; the "Muat lebih banyak" button is what keeps
 * paging, and `status === "Exhausted"` is the only end-of-list signal.
 */
export function useMateriLibrary(
  tenantId: Id<"tenants"> | undefined,
  tag: string | null,
  enabled: boolean,
  pageSize: number = LIBRARY_PAGE_SIZE
): MateriLibrary {
  const args =
    enabled && tenantId !== undefined
      ? tag === null
        ? { tenantId }
        : { tenantId, tag }
      : "skip";
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.features.materi.library.listLibrary,
    args,
    { initialNumItems: pageSize }
  );
  return { materi: results, status, isLoading, loadMore };
}

/**
 * The tenant's tag cloud with counts, sorted count-desc then alphabetically.
 *
 * A count is a ROW count: a draft materi contributes to its tags' counts even
 * for a plain member (the server documents why — filtering would cost one read
 * per tag row, and a number names nothing). So a chip can read "8" and show
 * seven rows to a member. That is the server's deliberate trade, mirrored here
 * so nobody "fixes" it in the UI.
 */
export function useMateriTags(
  tenantId: Id<"tenants"> | undefined,
  enabled: boolean
): TagCount[] | undefined {
  return useQuery(
    api.features.materi.library.listTags,
    enabled && tenantId !== undefined ? { tenantId } : "skip"
  );
}
