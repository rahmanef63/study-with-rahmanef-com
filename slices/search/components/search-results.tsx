"use client";
// search slice — grouped results (Kelas / Materi / Sumber). Presentational:
// hits come in flat with a kind discriminator; grouping + hrefs derived here.
// Sumber rows (#29) open their EXTERNAL url in a new tab — see SearchResultItem.
import { hitHref } from "../lib/hrefs";
import type { SearchHit } from "../types";
import type { SearchCopy } from "../config/copy";
import { SearchResultItem } from "./search-result-item";

export type SearchResultsProps = {
  hits: SearchHit[];
  tenantSlug: string;
  onNavigate?: (href: string) => void;
  copy: SearchCopy;
};

export function SearchResults({ hits, tenantSlug, onNavigate, copy }: SearchResultsProps) {
  const groups = [
    { label: copy.groupCourses, items: hits.filter((h) => h.kind === "course") },
    { label: copy.groupLessons, items: hits.filter((h) => h.kind === "lesson") },
    { label: copy.groupResources, items: hits.filter((h) => h.kind === "resource") },
  ].filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.label} className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.label}
          </h3>
          <ul className="space-y-2">
            {group.items.map((hit) => (
              <SearchResultItem
                key={
                  hit.kind === "lesson"
                    ? hit.lessonId
                    : hit.kind === "resource"
                      ? `resource-${hit.url}`
                      : `course-${hit.courseSlug}`
                }
                hit={hit}
                href={hitHref(tenantSlug, hit)}
                onNavigate={onNavigate}
                copy={copy}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
