"use client";
// materi slice — the SKILLS library, mounted at /k/<slug>/skills.
//
// A skill is a materi with `kind: "skill"` and a `promptText`, so this view
// shares almost everything with ./materi-library-view.tsx: the same paginated
// query with a different kind, the same tag rack, the same sort control, the
// same inset rows. Read that file first; this header only covers the deltas.
//
// DELTA 1 — SEARCH IS A SERVER QUERY, not a filter over loaded pages. What you
// search a prompt catalogue by is the prompt itself: "the one that outputs a
// table", "the one with step by step in it". `searchSkills` matches TITLE OR
// PROMPT TEXT across the whole library, so it finds rows nowhere near the
// current page — which is also why the field is always visible here while the
// materi library hides its narrowing box below eight rows. Searching REPLACES
// the paginated list rather than filtering it: one is a cursor over an index,
// the other the top 20 of a bounded scan, and they cannot be merged.
//
// DELTA 2 — the empty state is a real explanation, because the library ships
// EMPTY (prompts were deliberately deferred) and ../components/skills-empty.tsx
// is therefore the launch screen rather than a fallback.
//
// DELTA 3 — three tags per row instead of two: a skill usually sits in no
// course, so the row's meta line has the width free, and tags are the only
// classification a prompt has.
import { useState } from "react";
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { CommandSearch } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";
import { useMyMembership } from "@/features/tenants";
import { LibraryToolbar } from "../components/library-toolbar";
import { MateriList, MateriListSkeleton } from "../components/materi-list";
import { SkillsEmpty } from "../components/skills-empty";
import { TagChips } from "../components/tag-chips";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { LIBRARY_PAGE_SIZE } from "../config/limits";
import { useMateriLibrary, useMateriTags } from "../hooks/use-materi-library";
import { useSkillSearch } from "../hooks/use-skills";
import type { MateriSort } from "../types";

export type SkillsLibraryViewProps = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  /** Tag the library OPENS on — `?tag=` from the URL. Starting position only. */
  initialTag?: string | null;
  /** Where an instructor goes to add one. A string, not a builder: a function
   *  prop cannot cross the server→client boundary. */
  kelolaHref: string;
  /** Rendered instead of the list when the viewer is not a member. */
  gate: ReactNode;
  copy?: MateriCopyOverride;
};

const SKELETON_LABEL = "Memuat skill…";

export function SkillsLibraryView({
  tenantId,
  tenantSlug,
  initialTag = null,
  kelolaHref,
  gate,
  copy: copyOverride,
}: SkillsLibraryViewProps) {
  const copy = mergeMateriCopy(copyOverride);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const isMember = isAuthenticated && membership !== null && membership !== undefined;
  const canManage = membership?.role === "instructor" || membership?.role === "owner";

  const [tag, setTag] = useState<string | null>(initialTag);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<MateriSort>("newest");

  const tags = useMateriTags(tenantId, isMember);
  const { materi, status, loadMore } = useMateriLibrary({
    tenantId,
    kind: "skill",
    tag,
    sort,
    enabled: isMember,
  });
  const searching = query.trim() !== "";
  const search = useSkillSearch(tenantId, query, tag, sort, isMember && searching);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <MateriListSkeleton label={SKELETON_LABEL} />;
  }
  if (!isMember) return <>{gate}</>;

  const controls = (
    <>
      <CommandSearch
        value={query}
        onChange={setQuery}
        placeholder={copy.skillsSearchPlaceholder}
      />
      {tags !== undefined ? <TagChips tags={tags} value={tag} onChange={setTag} /> : null}
    </>
  );

  // ── SEARCH RESULTS ─────────────────────────────────────────────────────────
  // A separate branch, not a filtered list: `searchSkills` returns the top 20
  // of a bounded scan with no cursor, so there is no "Muat lebih banyak" to
  // offer and no count that means the same thing as the library's.
  if (searching) {
    return (
      <div className="space-y-3">
        {controls}
        {!search.active ? (
          <p className="px-1 text-sm text-muted-foreground">{copy.searchTooShort}</p>
        ) : search.hits === undefined ? (
          <MateriListSkeleton label={SKELETON_LABEL} />
        ) : search.hits.length === 0 ? (
          <p className="border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {copy.emptySkillsSearch(query.trim())}
          </p>
        ) : (
          <>
            {/* No "+" and no A→Z footnote here: a search result has no cursor
                behind it, and its sort IS global — every match is in memory
                server-side before it is ordered and truncated. */}
            <LibraryToolbar
              count={search.hits.length}
              countSuffix={copy.skillsCountSuffix}
              sort={sort}
              onSortChange={setSort}
              copy={copyOverride}
            />
            <MateriList rows={search.hits} tenantSlug={tenantSlug} tagsShown={3} copy={copyOverride} />
          </>
        )}
      </div>
    );
  }

  // ── THE LIBRARY ────────────────────────────────────────────────────────────
  if (status === "LoadingFirstPage") {
    return (
      <div className="space-y-3">
        {controls}
        <MateriListSkeleton label={SKELETON_LABEL} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {controls}
      {materi.length === 0 ? (
        tag !== null ? (
          // A tag with no skills is not an empty library — the shared tag
          // cloud counts materi too, so this is the expected miss, and the
          // long "what is a skill" explanation would be noise on top of it.
          <p className="border-2 border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
            {copy.emptySkillsTag}
          </p>
        ) : (
          <SkillsEmpty canManage={canManage} kelolaHref={kelolaHref} copy={copyOverride} />
        )
      ) : (
        <>
          <LibraryToolbar
            count={materi.length}
            countSuffix={copy.skillsCountSuffix}
            hasMore={status !== "Exhausted"}
            sort={sort}
            onSortChange={setSort}
            copy={copyOverride}
          />
          <MateriList rows={materi} tenantSlug={tenantSlug} tagsShown={3} copy={copyOverride} />
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
