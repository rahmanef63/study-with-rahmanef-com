"use client";
// analytics slice — connected per-course analytics view for instructor+.
// Alpha mounts this into the kelola window-app:
//   <CourseAnalyticsView courseId={courseId} />
// Renders skeletons while loading; server-side authz (instructor+) is the
// security boundary — mounting this for a member only yields a thrown
// NOT_AUTHORIZED for the window's error boundary (route guards are UX).
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { LessonCompletionBars } from "../components/lesson-completion-bars";
import { QuizStatList } from "../components/quiz-stat-list";
import { StatCard } from "../components/stat-card";
import { mergeAnalyticsCopy, type AnalyticsCopyOverride } from "../config/copy";
import { useCourseAnalytics } from "../hooks/use-course-analytics";

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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label={copy.statMembers} value={data.memberCount} />
        <StatCard label={copy.statCompletions} value={data.courseCompletionCount} />
        <StatCard label={copy.statLessons} value={data.totalLessons} />
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{copy.lessonSectionTitle}</h3>
          <p className="text-xs text-muted-foreground">{copy.lessonSectionHint}</p>
        </div>
        <LessonCompletionBars
          lessons={data.lessons}
          denominator={data.memberCount}
          copy={copyOverride}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{copy.quizSectionTitle}</h3>
        <QuizStatList quizzes={data.quizzes} copy={copyOverride} />
      </section>
    </div>
  );
}
