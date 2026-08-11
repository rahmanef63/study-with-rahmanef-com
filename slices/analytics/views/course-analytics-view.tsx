"use client";
// analytics slice — connected per-course analytics view for instructor+.
// Alpha mounts this into the kelola window-app:
//   <CourseAnalyticsView courseId={courseId} />
// Renders skeletons while loading; server-side authz (instructor+) is the
// security boundary — mounting this for a member only yields a thrown
// NOT_AUTHORIZED for the window's error boundary (route guards are UX).
//
// 0.3.0: the per-materi completion bars were REPLACED by CourseFunnelView, not
// joined by it. Both rendered the same materi in the same order; the funnel adds
// reads and the drop-off on top of the completion count, so keeping the bars as
// well would have been the identical list twice, one of them strictly poorer.
// LessonCompletionBars is still exported for consumers without the insight
// feature (see index.ts).
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { QuizStatList } from "../components/quiz-stat-list";
import { StatCard } from "../components/stat-card";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import { useCourseAnalytics } from "../hooks/use-course-analytics";
import { CourseFunnelView } from "./course-funnel-view";

export type CourseAnalyticsViewProps = {
  courseId: Id<"courses">;
  copy?: AnalyticsCopyOverride;
  className?: string;
};

export function CourseAnalyticsView({ courseId, copy: copyOverride, className }: CourseAnalyticsViewProps) {
  const copy = mergeAnalyticsCopy(copyOverride);
  const data = useCourseAnalytics(courseId);

  if (data === undefined) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* THE DROP-OFF LEADS. These three cards used to sit above it; at 390px
          that put five stat cards between the instructor and the one thing they
          opened the course to find out. Members / badges / materi count are
          CONTEXT for the funnel, so they now read after it. */}
      <CourseFunnelView courseId={courseId} copy={copyOverride} />

      {/* Two columns on a phone, three from sm — a full-width card per number
          is a lot of scroll for three small integers. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label={copy.statMembers} value={data.memberCount} />
        <StatCard label={copy.statCompletions} value={data.courseCompletionCount} />
        <StatCard label={copy.statLessons} value={data.totalLessons} />
      </div>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{copy.quizSectionTitle}</h3>
        <QuizStatList quizzes={data.quizzes} copy={copyOverride} />
      </section>
    </div>
  );
}
