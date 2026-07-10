// courses slice — course overview header + syllabus (route
// /t/[slug]/kelas/[kelasSlug]; syllabus is public etalase, content locked
// behind membership — the QUERY enforces it, this is presentation).
import type { Id } from "@convex/_generated/dataModel";
import type { ReactNode } from "react";
import { ChevronDown, FileText, Layers, PlayCircle, Wallet } from "lucide-react";
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
  /** Consumer slot rendered between the "Tentang kelas ini" row and the syllabus
   *  (e.g. the integrator's "Sumber belajar" card that opens the resource board). */
  aboveSyllabusSlot?: ReactNode;
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
  aboveSyllabusSlot,
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
  // Video count is the only genuinely-new signal derivable with zero query
  // (hasVideo is already per-lesson in getOverview).
  const videoCount = overview.modules.reduce(
    (n, m) => n + m.lessons.filter((l) => l.hasVideo).length,
    0,
  );
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

      {/* Tentang kelas ini — course shape + cost + resources, all derived (no query). */}
      <div className="space-y-4">
        <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
          <li className="inline-flex items-center gap-1.5">
            <Layers className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="font-medium tabular-nums text-foreground">{moduleCount}</span> {copy.modules.toLowerCase()}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <FileText className="size-4 shrink-0 text-primary" aria-hidden />
            <span className="font-medium tabular-nums text-foreground">{overview.lessonCount}</span> {copy.lessons.toLowerCase()}
          </li>
          {videoCount > 0 ? (
            <li className="inline-flex items-center gap-1.5">
              <PlayCircle className="size-4 shrink-0 text-primary" aria-hidden />
              <span className="font-medium tabular-nums text-foreground">{videoCount}</span> {copy.videos.toLowerCase()}
            </li>
          ) : null}
        </ul>

        <div className={aboveSyllabusSlot ? "grid gap-4 @lg:grid-cols-2" : undefined}>
          {/* Biaya sampai selesai — a constant, honest truth (charity ethos): free.
              Progressive disclosure keeps it calm; the detail is one tap away. */}
          <div className="h-full rounded-[var(--radius-win)] border border-border bg-card p-4">
            <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Wallet className="size-3.5 shrink-0" aria-hidden /> {copy.costLabel}
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-success">{copy.costFree}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{copy.costFreeSub}</p>
            <details className="group mt-2">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-primary [&::-webkit-details-marker]:hidden">
                {copy.costMore}
                <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" aria-hidden />
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{copy.costDetail}</p>
            </details>
          </div>
          {aboveSyllabusSlot}
        </div>
      </div>

      <section aria-label={copy.modules}>
        <SectionHeader title={copy.modules} />
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
