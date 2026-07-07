// courses slice — course overview header + syllabus (route
// /t/[slug]/kelas/[kelasSlug]; syllabus is public etalase, content locked
// behind membership — the QUERY enforces it, this is presentation).
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { Hero, SectionHeader, Badge } from "@/components/mockup-kit";
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
  const moduleCount = overview.modules.length;
  const hasHeroSlot = statusLabel !== null || progressSlot != null || (!isMember && joinCtaSlot);

  return (
    <div className={className ? `space-y-10 ${className}` : "space-y-10"}>
      <Hero eyebrow={copy.courses} title={course.title} description={course.description}>
        {hasHeroSlot ? (
          <div className="space-y-4">
            {statusLabel !== null ? <Badge tone="muted">{statusLabel}</Badge> : null}
            {progressSlot}
            {!isMember && joinCtaSlot}
          </div>
        ) : null}
      </Hero>

      <section aria-label={copy.modules}>
        <SectionHeader
          title={copy.modules}
          actions={
            moduleCount > 0 ? (
              <Badge tone="muted">
                {moduleCount} {copy.modules.toLowerCase()} · {overview.lessonCount} {copy.lessons.toLowerCase()}
              </Badge>
            ) : null
          }
        />
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
