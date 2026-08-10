"use client";
// materi slice — the row that sits between a library's filters and its list:
// how many rows you are looking at, and the control that reorders them.
//
// ONE row, not two bands. The caption already names the list, so the control
// that reorders it belongs on the same line — stacking them would put two
// short strips above a list that is often shorter than they are.
//
// Rendered in three places (the materi library, the skills library, and the
// skills SEARCH results), which is exactly why it is a component: those three
// must not drift into three different rhythms above the same inset frame.
import type { MateriCopyOverride } from "../config/copy";
import { INSET_CAPTION } from "../lib/inset";
import { SortControl } from "./sort-control";
import type { MateriSort } from "../types";

export type LibraryToolbarProps = {
  count: number;
  /** "materi" / "skill" — the unit, not the label of the tab. */
  countSuffix: string;
  /** Append "+" — there are more pages behind the cursor, so the count is a
   *  floor rather than a total. Off for a search result, which has no cursor. */
  hasMore?: boolean;
  sort: MateriSort;
  onSortChange: (sort: MateriSort) => void;
  copy?: MateriCopyOverride;
};

export function LibraryToolbar({
  count,
  countSuffix,
  hasMore = false,
  sort,
  onSortChange,
  copy: copyOverride,
}: LibraryToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* pb-0: INSET_CAPTION carries the caption's own bottom gap, which the
          flex row's alignment already provides here. */}
      <p className={`${INSET_CAPTION} pb-0`} aria-live="polite">
        {`${count} ${countSuffix}`}
        {hasMore ? "+" : ""}
      </p>
      {/* Labelled by SortControl's own role="group" + aria-label. */}
      <SortControl value={sort} onChange={onSortChange} copy={copyOverride} />
    </div>
  );
}
