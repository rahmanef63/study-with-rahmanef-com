// courses slice — the lesson player composition (R4: YouTube embed +
// markdown + resource links). `completionSlot` is the seam for progress
// (#3): it injects the "tandai selesai" button through the barrel.
import { ArrowLeft, ArrowRight, Youtube } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { buildYoutubeWatchUrl } from "../lib/youtube";
import type { LessonViewData } from "../types";
import { LessonLinks } from "./lesson-links";
import { MarkdownView } from "./markdown-view";
import { YoutubeEmbed } from "./youtube-embed";

export type LessonViewProps = {
  lesson: LessonViewData;
  /** Route builders — consumer owns the routing scheme. */
  lessonHref: (lessonId: string) => string;
  backHref: string;
  /** Injected by progress (#3): mark-complete button / status chip. */
  completionSlot?: ReactNode;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function LessonView({
  lesson,
  lessonHref,
  backHref,
  completionSlot,
  copy: copyOverride,
  className,
}: LessonViewProps) {
  const copy = mergeCopy(copyOverride);
  const watchUrl =
    lesson.youtubeVideoId !== undefined ? buildYoutubeWatchUrl(lesson.youtubeVideoId) : null;

  return (
    <article className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <header className="space-y-3">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="-ml-2 min-h-11 text-muted-foreground sm:min-h-9"
        >
          <Link href={backHref}>
            <ArrowLeft aria-hidden /> {copy.backToCourse}
          </Link>
        </Button>
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">{lesson.courseTitle}</span>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl">{lesson.title}</h1>
        </div>
      </header>

      {lesson.youtubeVideoId !== undefined ? (
        <div className="space-y-2">
          <YoutubeEmbed videoId={lesson.youtubeVideoId} title={lesson.title} />
          {watchUrl !== null && (
            <Link
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground underline-offset-4 hover:underline sm:min-h-0"
            >
              <Youtube className="size-4 shrink-0" aria-hidden /> {copy.watchOnYoutube}
            </Link>
          )}
        </div>
      ) : null}

      {/* Reading column — comfortable measure for prose (UI-UX-PRD §1.1). */}
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <section aria-label={copy.material}>
          <MarkdownView content={lesson.contentMd} />
        </section>

        <LessonLinks links={lesson.links} heading={copy.resources} />

        {completionSlot !== undefined && (
          <div className="sticky bottom-3 z-10">{completionSlot}</div>
        )}

        <nav className="flex items-center justify-between gap-3 border-t border-border pt-5">
          {lesson.prevLessonId !== null ? (
            <Button asChild variant="outline" size="sm" className="min-h-11 sm:min-h-9">
              <Link href={lessonHref(lesson.prevLessonId)}>
                <ArrowLeft aria-hidden /> {copy.prevLesson}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {lesson.nextLessonId !== null ? (
            <Button asChild variant="outline" size="sm" className="min-h-11 sm:min-h-9">
              <Link href={lessonHref(lesson.nextLessonId)}>
                {copy.nextLesson} <ArrowRight aria-hidden />
              </Link>
            </Button>
          ) : (
            <span />
          )}
        </nav>
      </div>
    </article>
  );
}
