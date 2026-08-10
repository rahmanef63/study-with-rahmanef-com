"use client";
// quiz slice — the course's quizzes as the tail of the silabus list.
//
// Quizzes are per COURSE now (DECISIONS #37), not per module, so there is no
// "module footer" to hang them on: they are the last rows of the syllabus.
// Renders `<li>` elements on purpose — SyllabusList splices this into its
// `<ol>`, so a quiz reads as a step of the course rather than a card floating
// underneath it.
//
// Member-gated: listQuizzesForCourse throws for outsiders, so only mount this
// inside the member branch of the course page. Renders nothing at all when the
// course has no quiz — an empty "Kuis" heading is worse than silence.
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Badge } from "@/components/mockup-kit";
import { mergeQuizCopy, type QuizCopy, type QuizCopyOverride } from "../config/copy";
import { useMyAttempts, useQuizzesForCourse } from "../hooks/use-quiz";
import type { CourseQuizRow } from "../types";

export type CourseQuizListProps = {
  courseId: Id<"courses">;
  /** Route builder — e.g. (id) => `/k/${t}/kelas/${c}/kuis/${id}`. */
  quizHref: (quizId: Id<"quizzes">) => string;
  copy?: QuizCopyOverride;
};

const ROW =
  "flex min-h-12 items-center gap-3 px-4 py-2.5 text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring @sm:min-h-11";

function QuizRow({
  quiz,
  href,
  copy,
}: {
  quiz: CourseQuizRow;
  href: string;
  copy: QuizCopy;
}) {
  const attempts = useMyAttempts(quiz._id);
  // The server stores `passed` per attempt → once ANY attempt passed, lulus.
  // attempts === undefined (loading) falls through to the neutral state.
  const passed = (attempts ?? []).some((a) => a.passed);
  const attempted = (attempts ?? []).length > 0;
  return (
    <li>
      <Link href={href} className={ROW}>
        <GraduationCap className="size-4 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1 truncate font-medium">{quiz.title}</span>
        <span className="hidden shrink-0 tabular-nums text-xs text-muted-foreground @sm:inline">
          {quiz.questionCount} {copy.quizMeta}
        </span>
        <span className="shrink-0">
          {passed ? (
            <Badge tone="success">{copy.quizPassed}</Badge>
          ) : attempted ? (
            <Badge tone="muted">{copy.quizNotPassed}</Badge>
          ) : (
            <Badge tone="accent">{copy.quizStart}</Badge>
          )}
        </span>
      </Link>
    </li>
  );
}

export function CourseQuizList({ courseId, quizHref, copy: copyOverride }: CourseQuizListProps) {
  const copy = mergeQuizCopy(copyOverride);
  const quizzes = useQuizzesForCourse(courseId);
  if (quizzes === undefined || quizzes.length === 0) return null;
  return (
    <>
      {quizzes.map((quiz) => (
        <QuizRow key={quiz._id} quiz={quiz} href={quizHref(quiz._id)} copy={copy} />
      ))}
    </>
  );
}
