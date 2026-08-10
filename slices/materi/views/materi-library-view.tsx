"use client";
// materi slice — the connected library view, mounted at /k/<slug>/materi.
//
// FULLY client-side, and it has to be: `listLibrary` and `listTags` are both
// requireTenantRole(member), and a server component in this app is permanently
// anonymous (tokens live in localStorage, proxy.ts is a stub). Nothing here
// could be server-rendered even if we wanted it indexed — and we do not: a
// list of every materi in a community is exactly what membership buys.
//
// The `gate` is a ReactNode prop, not a component this slice imports: the
// join CTA is the app's <GabungDulu/> and a slice may not reach into app/.
// A ReactNode crosses the server→client boundary fine; a FUNCTION PROP DOES
// NOT — which is why `tenantSlug` comes in as a string and every href is built
// right here (lib/hrefs.ts) instead of being handed down as a builder.
//
// Its sibling is ./skills-library-view.tsx. They share the row, the list, the
// tag rack and the sort control; they differ in exactly one thing, which is
// what SEARCH means (see that file's header).
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { CommandSearch } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";
import { useMyMembership } from "@/features/tenants";
import { LibraryToolbar } from "../components/library-toolbar";
import { MateriList, MateriListSkeleton } from "../components/materi-list";
import { TagChips } from "../components/tag-chips";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { LIBRARY_PAGE_SIZE, SEARCH_FROM } from "../config/limits";
import { useMateriLibrary, useMateriTags } from "../hooks/use-materi-library";
import type { MateriSort } from "../types";

export type MateriLibraryViewProps = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  /** Tag the library OPENS on — `?tag=` from the URL (a tag row on a materi
   *  page links here). Starting position only; the chips never re-navigate. */
  initialTag?: string | null;
  /** Rendered instead of the list when the viewer is not a member. */
  gate: ReactNode;
  copy?: MateriCopyOverride;
};

export function MateriLibraryView({
  tenantId,
  tenantSlug,
  initialTag = null,
  gate,
  copy: copyOverride,
}: MateriLibraryViewProps) {
  const copy = mergeMateriCopy(copyOverride);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const isMember = isAuthenticated && membership !== null && membership !== undefined;

  const [tag, setTag] = useState<string | null>(initialTag);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MateriSort>("newest");

  const tags = useMateriTags(tenantId, isMember);
  const { materi, status, loadMore } = useMateriLibrary({
    tenantId,
    tag,
    sort,
    enabled: isMember,
  });

  // Client-side text filter over the LOADED pages only — there is no server
  // search on the materi library (that is what /cari is for, and it is a
  // different, indexed query). Narrowing what you can already see is the
  // honest scope for a field that sits on top of a paginated list. The SKILLS
  // library is the one that gets a real server search, because a prompt
  // catalogue is unbrowsable without one.
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q === "" ? materi : materi.filter((m) => m.title.toLowerCase().includes(q))),
    [materi, q]
  );

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <MateriListSkeleton label="Memuat materi…" />;
  }
  if (!isMember) return <>{gate}</>;
  if (status === "LoadingFirstPage") return <MateriListSkeleton label="Memuat materi…" />;

  const showSearch = materi.length >= SEARCH_FROM || query !== "";

  return (
    <div className="space-y-3">
      {showSearch ? (
        <CommandSearch value={query} onChange={setQuery} placeholder={copy.searchPlaceholder} />
      ) : null}
      {tags !== undefined ? <TagChips tags={tags} value={tag} onChange={setTag} /> : null}

      {visible.length === 0 ? (
        <p className="border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          {q !== "" ? copy.emptySearch(query) : tag !== null ? copy.emptyTag : copy.emptyLibrary}
        </p>
      ) : (
        <>
          <LibraryToolbar
            count={visible.length}
            countSuffix={copy.countSuffix}
            hasMore={status !== "Exhausted"}
            sort={sort}
            onSortChange={setSort}
            copy={copyOverride}
          />
          <MateriList rows={visible} tenantSlug={tenantSlug} copy={copyOverride} />
          {/* A→Z rides no index (`lessons` has no title column to range over),
              so it orders the loaded pages and page 2 restarts the alphabet.
              Said out loud while it is still true, rather than shipping a
              sort that quietly lies once the list is longer than one page. */}
          {sort === "title" && status !== "Exhausted" ? (
            <p className="text-[0.6875rem] leading-relaxed text-muted-foreground">
              {copy.sortTitleNote}
            </p>
          ) : null}
        </>
      )}

      {status === "CanLoadMore" || status === "LoadingMore" ? (
        <Button
          variant="outline"
          className="w-full"
          disabled={status === "LoadingMore"}
          onClick={() => loadMore(LIBRARY_PAGE_SIZE)}
        >
          {status === "LoadingMore" ? copy.loadingMore : copy.loadMore}
        </Button>
      ) : null}
    </div>
  );
}
