"use client";
// materi slice — the library reads (rr "Data fetching": useQuery /
// usePaginatedQuery from convex/react; never fetch in useEffect).
//
// ONE hook for BOTH libraries, because there is one server query: a skill IS a
// materi (`lessons.kind`), so /materi and /skills are the same paginated read
// with a different `kind`.
//
// EVERY query here is MEMBER+ — there is no anonymous library, because a list
// of every materi in a community is exactly what membership buys. So they take
// an `enabled` flag and pass "skip" when it is false: calling them logged-out
// would throw NOT_AUTHORIZED straight into the error boundary instead of
// letting the page render its join CTA.
import { usePaginatedQuery, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { LIBRARY_PAGE_SIZE } from "../config/limits";
import type { MateriCard, MateriKind, MateriSort, TagCount } from "../types";

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

export type MateriLibraryArgs = {
  tenantId: Id<"tenants"> | undefined;
  /** Omitted means "materi" — the same default `lessons.kind` carries, so the
   *  pre-existing library behaves exactly as it did before skills existed. */
  kind?: MateriKind;
  /** `null` = "Semua". */
  tag: string | null;
  /** Omitted means "newest". */
  sort?: MateriSort;
  enabled: boolean;
  pageSize?: number;
};

/**
 * Paginated library for one kind, optionally narrowed to one tag and ordered
 * three ways.
 *
 * `tag === null` and an absent `kind`/`sort` OMIT the argument rather than
 * sending undefined, so the server walks its default index range.
 *
 * TWO THINGS THE SERVER IS HONEST ABOUT, mirrored here so nobody "fixes" them:
 *   · A→Z is IN-PAGE. `lessons` has no title index, so a globally alphabetised
 *     library would mean reading every row of the tenant — unbounded, which
 *     AGENTS.md §6 forbids. Page 2 restarts the alphabet; the view says so.
 *   · A TAGGED page can come back shorter than the page size while `isDone` is
 *     still false — the server post-filters rows of the wrong kind or the
 *     wrong visibility. That is normal Convex pagination; "Muat lebih banyak"
 *     keeps paging and `status === "Exhausted"` is the only end-of-list signal.
 *
 * Changing `kind`, `tag` or `sort` restarts pagination from page one — that is
 * usePaginatedQuery's own behaviour when the args change, and it is what a
 * reader expects from a filter.
 */
export function useMateriLibrary({
  tenantId,
  kind,
  tag,
  sort,
  enabled,
  pageSize = LIBRARY_PAGE_SIZE,
}: MateriLibraryArgs): MateriLibrary {
  const args =
    enabled && tenantId !== undefined
      ? {
          tenantId,
          ...(kind === undefined ? {} : { kind }),
          ...(tag === null ? {} : { tag }),
          ...(sort === undefined ? {} : { sort }),
        }
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
 * ONE cloud for BOTH libraries: `listTags` counts a tag whether it sits on a
 * materi or on a skill, because splitting it by kind would cost one lesson
 * read per tag row. So a chip can appear in the skills library and filter down
 * to nothing — the empty state covers it, and it is cheaper than the split.
 *
 * A count is also a ROW count: a draft materi contributes to its tags' counts
 * even for a plain member (filtering would cost the same per-tag read, and a
 * number names nothing). So a chip can read "8" and show seven rows. Both are
 * the server's deliberate trades, mirrored here.
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
