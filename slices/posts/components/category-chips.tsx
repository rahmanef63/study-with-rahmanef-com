"use client";
// posts slice — the feed's category filter.
//
// The chip set IS the hardcoded kind union (POST_KINDS + "Semua"): there is no
// categories table by design (DECISIONS #29), so this renders a fixed list and
// nothing here can drift from the server validator.
import { FilterChip } from "@/components/mockup-kit";
import { mergePostsCopy, type PostsCopyOverride } from "../config/copy";
import { POST_KINDS, postKindLabel } from "../lib/kind";
import type { PostKindFilter } from "../types";

export type CategoryChipsProps = {
  /** `null` = "Semua". */
  value: PostKindFilter;
  onChange: (kind: PostKindFilter) => void;
  copy?: PostsCopyOverride;
  className?: string;
};

export function CategoryChips({ value, onChange, copy: copyOverride, className }: CategoryChipsProps) {
  const copy = mergePostsCopy(copyOverride);
  return (
    <div
      role="group"
      aria-label={copy.fieldKind}
      // ONE row that scrolls, never a wrapping rack. Five chips wrapped to two
      // rows at 390px and cost ~100px above the first post; a single row is how
      // a segmented filter behaves on a phone. -mx-4 px-4 lets it bleed to the
      // screen edge so the last chip is visibly cut off — the affordance that
      // says "there is more here".
      className={
        className
          ? `-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 ${className}`
          : "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0"
      }
    >
      <FilterChip label={copy.filterAll} active={value === null} onClick={() => onChange(null)} />
      {POST_KINDS.map((kind) => (
        <FilterChip
          key={kind}
          label={postKindLabel(kind, copy)}
          active={value === kind}
          onClick={() => onChange(value === kind ? null : kind)}
        />
      ))}
    </div>
  );
}
