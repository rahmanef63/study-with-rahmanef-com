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
      className={className ? `flex flex-wrap gap-2 ${className}` : "flex flex-wrap gap-2"}
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
