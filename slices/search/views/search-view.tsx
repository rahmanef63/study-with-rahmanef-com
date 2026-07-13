"use client";
// search slice — SearchView({ tenantId, tenantSlug }): the barrel view alpha
// mounts as an OS-shell window-app (#23). Self-contained: reads via
// useTenantSearch (member-only — the SERVER rejects anon/outsiders; any gate
// here is UX only). Navigation goes through the onNavigate seam (openApp)
// with a next/link fallback so the slice stays portable — no os-shell import.
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Id } from "@convex/_generated/dataModel";
import { mergeSearchCopy, type SearchCopyOverride } from "../config/copy";
import { SEARCH_DEBOUNCE_MS } from "../config/limits";
import { useDebouncedValue } from "../hooks/use-debounced-value";
import { useTenantSearch } from "../hooks/use-tenant-search";
import { SearchEmptyState } from "../components/search-empty-state";
import { SearchInput } from "../components/search-input";
import { SearchResults } from "../components/search-results";

export type SearchViewProps = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  /** os-shell openApp seam — when set, result clicks call this instead of navigating. */
  onNavigate?: (href: string) => void;
  copy?: SearchCopyOverride;
  className?: string;
  autoFocus?: boolean;
};

export function SearchView({
  tenantId,
  tenantSlug,
  onNavigate,
  copy: copyOverride,
  className,
  autoFocus = true,
}: SearchViewProps) {
  const copy = mergeSearchCopy(copyOverride);
  const [input, setInput] = useState("");
  const debounced = useDebouncedValue(input, SEARCH_DEBOUNCE_MS);
  const { active, hits } = useTenantSearch(tenantId, debounced);

  return (
    <section className={className ? `space-y-4 ${className}` : "space-y-4"}>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{copy.sectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{copy.sectionSubtitle}</p>
      </div>

      <SearchInput value={input} onChange={setInput} copy={copy} autoFocus={autoFocus} />

      {!active ? (
        <p className="text-xs text-muted-foreground">{copy.hintMin}</p>
      ) : hits === undefined ? (
        <div className="space-y-2" aria-busy>
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      ) : hits.length === 0 ? (
        <SearchEmptyState title={copy.emptyTitle} hint={copy.emptyHint} />
      ) : (
        <SearchResults
          hits={hits}
          tenantSlug={tenantSlug}
          onNavigate={onNavigate}
          copy={copy}
        />
      )}
    </section>
  );
}
