// materi slice — one row of the library.
//
// A ROW, not a card. A framed card costs 2px of border, a 3px hard shadow and
// 8px of gap per materi; the library is the longest list in the app, so that
// is ~15px of chrome around ~40px of content, N times. The inset group gives
// the eye one edge to track down instead of N (see ../lib/inset.ts).
import Link from "next/link";
import { ChevronRight, FileWarning } from "lucide-react";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { INSET_ROW } from "../lib/inset";
import type { MateriCard } from "../types";

export type MateriRowProps = {
  materi: MateriCard;
  /** Canonical permalink. Built by the caller (host owns the URL scheme). */
  href: string;
  /** Tags shown inline before the row runs out of width. */
  tagsShown?: number;
  copy?: MateriCopyOverride;
};

export function MateriRow({ materi, href, tagsShown = 2, copy: copyOverride }: MateriRowProps) {
  const copy = mergeMateriCopy(copyOverride);
  const tags = materi.tags.slice(0, tagsShown);
  const overflow = materi.tags.length - tags.length;

  return (
    <li>
      <Link href={href} className={`${INSET_ROW} hover:bg-primary/5`}>
        <span className="min-w-0 flex-1 space-y-1">
          {/* Body face, NOT font-display: Press Start 2P truncates a title of
              any real length (design-system rule — display face is for labels). */}
          <span className="block line-clamp-2 text-sm leading-snug [overflow-wrap:anywhere]">
            {materi.title}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.6875rem] leading-none text-muted-foreground">
            {/* One template string rather than `{n} {label}`: two sibling
                expressions leave the space at the mercy of JSX whitespace
                trimming, and at 11px/leading-none you cannot see it go. */}
            {materi.courseCount > 0 ? (
              <span className="tabular-nums">
                {`${materi.courseCount} ${copy.courseCountSuffix}`}
              </span>
            ) : null}
            {tags.map((tag) => (
              <span key={tag} className="border border-border px-1.5 py-0.5">
                {tag}
              </span>
            ))}
            {overflow > 0 ? <span className="tabular-nums">+{overflow}</span> : null}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** The same row for a materi the backfill never slugged: no canonical URL, so
 *  nothing to link to. Rendered rather than dropped — an instructor has to be
 *  able to SEE that the row exists in order to go fix it. */
export function MateriRowUnlinked({ materi }: { materi: MateriCard }) {
  return (
    <li>
      <span className={`${INSET_ROW} text-muted-foreground`}>
        <FileWarning className="size-4 shrink-0 opacity-40" aria-hidden />
        <span className="min-w-0 flex-1 line-clamp-2 text-sm leading-snug">{materi.title}</span>
      </span>
    </li>
  );
}
