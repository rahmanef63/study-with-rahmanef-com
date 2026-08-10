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
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { CommandSearch } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMembership } from "@/features/tenants";
import { MateriRow, MateriRowUnlinked } from "../components/materi-row";
import { TagChips } from "../components/tag-chips";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { LIBRARY_PAGE_SIZE, SEARCH_FROM } from "../config/limits";
import { useMateriLibrary, useMateriTags } from "../hooks/use-materi-library";
import { buildMateriPageHref } from "../lib/hrefs";
import { INSET_CAPTION, INSET_GROUP } from "../lib/inset";

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

function ListSkeleton() {
  return (
    <div className="space-y-2" aria-busy>
      <span className="sr-only">Memuat materi…</span>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}

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

  const tags = useMateriTags(tenantId, isMember);
  const { materi, status, loadMore } = useMateriLibrary(tenantId, tag, isMember);

  // Client-side text filter over the LOADED pages only — there is no server
  // search on the library (that is what /cari is for, and it is a different,
  // indexed query). Narrowing what you can already see is the honest scope for
  // a field that sits on top of a paginated list.
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () => (q === "" ? materi : materi.filter((m) => m.title.toLowerCase().includes(q))),
    [materi, q]
  );

  if (isAuthLoading || (isAuthenticated && membership === undefined)) return <ListSkeleton />;
  if (!isMember) return <>{gate}</>;
  if (status === "LoadingFirstPage") return <ListSkeleton />;

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
          <p className={INSET_CAPTION}>
            {visible.length} {copy.countSuffix}
            {status !== "Exhausted" ? "+" : ""}
          </p>
          <ul className={INSET_GROUP}>
            {visible.map((m) =>
              m.slug === null ? (
                <MateriRowUnlinked key={m._id} materi={m} />
              ) : (
                <MateriRow
                  key={m._id}
                  materi={m}
                  href={buildMateriPageHref(tenantSlug, m.slug)}
                  copy={copyOverride}
                />
              )
            )}
          </ul>
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
