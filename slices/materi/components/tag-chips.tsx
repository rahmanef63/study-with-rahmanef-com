"use client";
// materi slice — the library's tag filter.
//
// Unlike the Diskusi kind chips (a hardcoded four-member union) this rack is
// DATA: `listTags` returns whatever the community has tagged, count-desc. So
// it is capped and it scrolls — a filter row that wraps to four lines is a
// second list to read, not a control.
import { FilterChip } from "@/components/mockup-kit";
import { TAG_CHIPS_SHOWN } from "../config/limits";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import type { TagCount } from "../types";

export type TagChipsProps = {
  tags: TagCount[];
  /** `null` = "Semua". */
  value: string | null;
  onChange: (tag: string | null) => void;
  /** How many chips to render before cutting the rack off. */
  limit?: number;
  copy?: MateriCopyOverride;
  className?: string;
};

export function TagChips({
  tags,
  value,
  onChange,
  limit = TAG_CHIPS_SHOWN,
  copy: copyOverride,
  className,
}: TagChipsProps) {
  const copy = mergeMateriCopy(copyOverride);
  if (tags.length === 0) return null;

  // The active tag is always rendered, even when it falls outside the top N —
  // a filter you cannot see is a filter you cannot switch off.
  const shown = tags.slice(0, limit);
  const active = value === null ? undefined : tags.find((t) => t.tag === value);
  if (active !== undefined && !shown.includes(active)) shown.push(active);

  return (
    <div
      role="group"
      aria-label={copy.tagsLabel}
      // ONE row that scrolls, never a wrapping rack. The -mx-4/px-4 bleed lets
      // the last chip be visibly cut off — the affordance that says "more here".
      className={
        "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" +
        (className ? ` ${className}` : "")
      }
    >
      <FilterChip label={copy.filterAll} active={value === null} onClick={() => onChange(null)} />
      {shown.map((t) => (
        <FilterChip
          key={t.tag}
          label={`${t.tag} ${t.count}`}
          active={value === t.tag}
          onClick={() => onChange(value === t.tag ? null : t.tag)}
        />
      ))}
    </div>
  );
}
