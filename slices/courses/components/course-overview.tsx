// courses slice — course overview header + syllabus (route
// /t/[slug]/kelas/[kelasSlug]; syllabus is public etalase, content locked
// behind membership — the QUERY enforces it, this is presentation).
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import type { CourseOverviewData, SyllabusModuleData } from "../types";
import { SyllabusList } from "./syllabus-list";

export type CourseOverviewProps = {
  overview: CourseOverviewData;
  lessonHref: (lessonId: Id<"lessons">) => string;
  /** Viewer is a member → lesson rows are links (non-members see a lock). */
  isMember: boolean;
  /** Consumer slot for the join CTA (tenants slice owns the join flow). */
  joinCtaSlot?: ReactNode;
  /** From progress (#3) via barrel. */
  completedLessonIds?: ReadonlyArray<string>;
  /** From progress (#3): e.g. a course progress bar under the header. */
  progressSlot?: ReactNode;
  /** Per-module slot forwarded to the syllabus (e.g. the module's quiz CTA). */
  renderModuleFooter?: (module: SyllabusModuleData) => ReactNode;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function CourseOverview({
  overview,
  lessonHref,
  isMember,
  joinCtaSlot,
  completedLessonIds,
  progressSlot,
  renderModuleFooter,
  copy: copyOverride,
  className,
}: CourseOverviewProps) {
  const copy = mergeCopy(copyOverride);
  const { course } = overview;
  const statusLabel =
    course.status === "draft"
      ? copy.statusDraft
      : course.status === "archived"
        ? copy.statusArchived
        : null;

  return (
    <div className={className ? `space-y-8 ${className}` : "space-y-8"}>
      <header className="space-y-3">
        {statusLabel !== null && (
          <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {statusLabel}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight">{course.title}</h1>
        <p className="max-w-prose leading-7 text-muted-foreground">{course.description}</p>
        {progressSlot}
        {!isMember && joinCtaSlot}
      </header>

      <section aria-label={copy.modules}>
        <SyllabusList
          modules={overview.modules}
          lessonHref={lessonHref}
          completedLessonIds={completedLessonIds}
          locked={!isMember}
          emptyText={copy.emptySyllabus}
          lockedText={copy.lockedLesson}
          renderModuleFooter={renderModuleFooter}
        />
      </section>
    </div>
  );
}
