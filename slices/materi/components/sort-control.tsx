"use client";
// materi slice — the library's sort control. Shared by BOTH libraries, which
// is the point: /materi and /skills are the same paginated read, so they must
// not grow two different ways to order it.
//
// A three-cell segmented control, not a <select> and not a dropdown. Three
// options is under the threshold where hiding them behind a menu buys anything
// — a menu costs a tap to discover what the choices even are, and here they
// fit on one line at 320px. It is also the ViewToggle geometry the mockup kit
// already uses (joined cells, hard 2px frame, active cell filled), so the app
// keeps one vocabulary for "pick one of a few".
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import type { MateriSort } from "../types";

export type SortControlProps = {
  value: MateriSort;
  onChange: (sort: MateriSort) => void;
  copy?: MateriCopyOverride;
  className?: string;
};

export function SortControl({
  value,
  onChange,
  copy: copyOverride,
  className,
}: SortControlProps) {
  const copy = mergeMateriCopy(copyOverride);
  const options: Array<{ value: MateriSort; label: string }> = [
    { value: "newest", label: copy.sortNewest },
    { value: "oldest", label: copy.sortOldest },
    { value: "title", label: copy.sortTitle },
  ];

  return (
    <div
      role="group"
      aria-label={copy.sortLabel}
      // shrink-0: it shares a row with the count caption, and a squashed
      // "Terbaru" is worse than a wrapped caption.
      className={"inline-flex shrink-0 items-center border border-border" + (className ? ` ${className}` : "")}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            // aria-pressed, not aria-current: this is a toggle group, and the
            // page it sits on has not changed.
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            // min-h-11 on a phone (the 44px floor), 32px from @sm up where it
            // is a mouse target sitting next to a 9px caption.
            className={
              "min-h-11 px-2.5 text-[0.6875rem] leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring @sm:min-h-8 " +
              (active
                ? "bg-primary font-medium text-primary-foreground"
                : "text-muted-foreground hover:text-foreground")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
