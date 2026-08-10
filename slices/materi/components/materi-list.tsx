// materi slice — the inset group both libraries render into.
//
// Extracted rather than duplicated because the two libraries must stay one
// list: the same rows, the same 56px rhythm, the same single frame. The only
// thing that varies is how many tags fit before the row runs out of width.
//
// EVERY href goes through `buildKindPageHref`, which dispatches on the ROW'S
// OWN kind — so a skill that turns up in the materi list (it should not, but
// a tag filter reads one shared cloud) still links to /skills/<slug>, and a
// link never lands on the wrong permalink and bounces through a redirect.
import { Skeleton } from "@/components/ui/skeleton";
import type { MateriCopyOverride } from "../config/copy";
import { buildKindPageHref } from "../lib/hrefs";
import { INSET_GROUP } from "../lib/inset";
import type { MateriCard } from "../types";
import { MateriRow, MateriRowUnlinked } from "./materi-row";

export type MateriListProps = {
  rows: MateriCard[];
  tenantSlug: string;
  /** Tags rendered inline per row before the rack is cut off. */
  tagsShown?: number;
  copy?: MateriCopyOverride;
};

export function MateriList({ rows, tenantSlug, tagsShown, copy }: MateriListProps) {
  return (
    <ul className={INSET_GROUP}>
      {rows.map((row) =>
        row.slug === null ? (
          // No slug → no canonical URL. Rendered anyway, not dropped: an
          // instructor has to be able to SEE the row in order to go fix it.
          <MateriRowUnlinked key={row._id} materi={row} />
        ) : (
          <MateriRow
            key={row._id}
            materi={row}
            href={buildKindPageHref(tenantSlug, row.kind, row.slug)}
            tagsShown={tagsShown}
            copy={copy}
          />
        )
      )}
    </ul>
  );
}

/** Three rows of the real geometry, so the list does not jump when it lands. */
export function MateriListSkeleton({ label = "Memuat…" }: { label?: string }) {
  return (
    <div className="space-y-2" aria-busy>
      <span className="sr-only">{label}</span>
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  );
}
