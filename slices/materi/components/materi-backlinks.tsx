// materi slice — "Muncul di kelas: …", the feature the materi model exists for.
//
// One materi, many courses: the same sheet can be week 3 of "Claude Code" and
// week 1 of "Hermes", and the reader should be able to see that and jump. The
// second group is the materi→materi graph (lessonRefs) — "materi terkait".
//
// Presentational: both lists and both href builders are props, so it renders
// identically from `getBySlug`'s embedded lists or from a live `backlinksFor`.
import Link from "next/link";
import { GraduationCap, Link2 } from "lucide-react";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { INSET_CAPTION, INSET_GROUP } from "../lib/inset";
import type { MateriCourseRef, MateriRef } from "../types";

export type MateriBacklinksProps = {
  courses: MateriCourseRef[];
  related: MateriRef[];
  courseHref: (courseSlug: string) => string;
  /** A materi with no slug has no canonical URL — the row renders as text. */
  materiHref: (lessonSlug: string) => string;
  copy?: MateriCopyOverride;
  className?: string;
};

const GROUP = `${INSET_GROUP} px-3.5 md:px-4`;
const ROW =
  "flex min-h-11 items-center gap-2 text-sm text-foreground transition-colors hover:text-primary";

export function MateriBacklinks({
  courses,
  related,
  courseHref,
  materiHref,
  copy: copyOverride,
  className,
}: MateriBacklinksProps) {
  const copy = mergeMateriCopy(copyOverride);
  if (courses.length === 0 && related.length === 0) return null;

  return (
    <div className={"space-y-4" + (className ? ` ${className}` : "")}>
      {courses.length > 0 ? (
        <div>
          <p className={INSET_CAPTION}>{copy.appearsInLabel}</p>
          <ul className={GROUP}>
            {courses.map((course) => (
              <li key={course._id}>
                <Link href={courseHref(course.slug)} className={ROW}>
                  <GraduationCap className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{course.title}</span>
                  {/* Position in THAT course — the same materi is #3 here and
                      #1 there, and the number is the reader's bearing. */}
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    #{course.order}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {related.length > 0 ? (
        <div>
          <p className={INSET_CAPTION}>{copy.relatedLabel}</p>
          <ul className={GROUP}>
            {related.map((materi) => (
              <li key={materi._id}>
                {materi.slug === null ? (
                  <span className={`${ROW} text-muted-foreground`}>
                    <Link2 className="size-4 shrink-0" aria-hidden />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{materi.title}</span>
                  </span>
                ) : (
                  <Link href={materiHref(materi.slug)} className={ROW}>
                    <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 [overflow-wrap:anywhere]">{materi.title}</span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
