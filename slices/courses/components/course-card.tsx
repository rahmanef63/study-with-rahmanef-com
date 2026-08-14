// courses slice — public etalase card (consumed by landing #5 + tenant home).
//
// Phone-first. At ~171px wide (the 2-column phone grid) the card is cover +
// title + progress and NOTHING else: the description is the first thing to go
// because it pushes the next class off the screen and nobody reads three lines
// of blurb in a 171px column. Everything restores at @sm (the desktop card
// keeps its h-28 cover, its blurb and its roomy padding).
//
// Container queries, not media queries: these cards are reused inside panels
// and the community <main> is the @container.
import Link from "next/link";
import { Badge } from "@/components/mockup-kit";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CourseCardData } from "../types";
import { CourseCover } from "./course-cover";

export type CourseCardProps = {
  course: CourseCardData;
  /** Route target — built by the consumer, e.g. `/t/${slug}/kelas/${course.slug}`. */
  href: string;
  /** Member progress (UI-UX-PRD §4). Omit for public/etalase cards. */
  progress?: { completedCount: number; totalCount: number };
  className?: string;
};

export function CourseCard({ course, href, progress, className }: CourseCardProps) {
  const pct =
    progress && progress.totalCount > 0
      ? Math.round((progress.completedCount / progress.totalCount) * 100)
      : null;
  return (
    <Link
      href={href}
      className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Card
        className={cn(
          "h-full gap-0 overflow-hidden py-0 transition-colors hover:border-primary/50",
          className,
        )}
      >
        {/* 2:1 on a phone so the art is unmistakable at 171px but still leaves
            the title above the fold; the desktop cover keeps its old h-28. */}
        <CourseCover
          slug={course.slug}
          src={course.coverImageUrl}
          className="aspect-[2/1] w-full border-b border-border @sm:aspect-auto @sm:h-28"
        />
        <div className="flex flex-col gap-1.5 p-2.5 @sm:gap-2 @sm:p-5">
          {/* BODY face and THREE lines on a phone; display face and two from
              @sm. Press Start 2P fits ~15 glyphs in the 173px phone column, so
              the display face plus a 2-line clamp truncated four of the six real
              course titles ("Prompt Engineering…", "Bikin Aplikasi Web dengan
              AI - dari…"). A card you cannot read the name of is not a denser
              card, it is a worse one. The third line costs 16px and six cards
              still clear the fold; the arcade voice keeps the cover badge, the
              eyebrow and every heading. */}
          <CardTitle className="line-clamp-2 text-title font-medium leading-snug">
            {course.title}
          </CardTitle>
          {/* The wrapper carries the hide/show; the clamp stays on the text.
              Both on one element and `@sm:block` beats `line-clamp-3`'s own
              `display:-webkit-box`, which silently unclamps the desktop card. */}
          <div className="hidden @sm:block">
            <CardDescription className="line-clamp-3 text-pretty">
              {course.description}
            </CardDescription>
          </div>
          {pct !== null && progress ? (
            <div className="mt-0.5 space-y-1 @sm:mt-1 @sm:space-y-1.5">
              <div className="flex items-center gap-2 @sm:gap-2.5">
                <div
                  className="h-1.5 min-w-0 flex-1 overflow-hidden bg-muted"
                  role="progressbar"
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progress: ${pct}%`}
                >
                  <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
                {pct === 100 ? <Badge tone="success">Selesai ✓</Badge> : null}
              </div>
              <p className="text-[10px] tabular-nums text-muted-foreground @sm:text-xs">
                {progress.completedCount}/{progress.totalCount} lesson selesai
              </p>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}
