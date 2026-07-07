"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { CourseOverviewView, useCourseOverview } from "@/features/courses";
import { CourseProgress, useCourseProgress } from "@/features/progress";
import { useQuizForTaking } from "@/features/quiz";
import { JoinButton } from "@/features/tenants";

type Props = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  courseSlug: string;
};

/**
 * Members get the progress layer (#3) on top of the shared overview; everyone
 * else renders the plain view. Split into two components because the progress
 * hooks are member-scoped on the server (NOT_AUTHORIZED for outsiders) — the
 * member variant only MOUNTS once viewerRole is known, so its queries never
 * fire for anonymous visitors. The duplicate overview subscription is deduped
 * by the Convex client.
 */
export function CourseOverviewClient({ tenantId, tenantSlug, courseSlug }: Props) {
  const overview = useCourseOverview(tenantId, courseSlug);
  const lessonHref = (lessonId: string) =>
    `/t/${tenantSlug}/kelas/${courseSlug}/belajar/${lessonId}`;
  const quizHref = (moduleId: string) =>
    `/t/${tenantSlug}/kelas/${courseSlug}/quiz/${moduleId}`;
  const joinCtaSlot = <JoinButton tenantId={tenantId} loginHref="/login" />;

  if (overview?.viewerRole != null) {
    return (
      <MemberCourseOverview
        tenantId={tenantId}
        courseSlug={courseSlug}
        courseId={overview.course._id}
        lessonHref={lessonHref}
        quizHref={quizHref}
        joinCtaSlot={joinCtaSlot}
      />
    );
  }

  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={lessonHref}
      joinCtaSlot={joinCtaSlot}
    />
  );
}

function MemberCourseOverview({
  tenantId,
  courseSlug,
  courseId,
  lessonHref,
  quizHref,
  joinCtaSlot,
}: {
  tenantId: Id<"tenants">;
  courseSlug: string;
  courseId: Id<"courses">;
  lessonHref: (lessonId: string) => string;
  quizHref: (moduleId: string) => string;
  joinCtaSlot: ReactNode;
}) {
  const progress = useCourseProgress(courseId);

  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={lessonHref}
      joinCtaSlot={joinCtaSlot}
      completedLessonIds={progress?.completedLessonIds}
      progressSlot={<CourseProgress courseId={courseId} />}
      // Each module's quiz CTA now sits directly under that module's lessons.
      renderModuleFooter={(m) => (
        <ModuleQuizEntry moduleId={m._id} title={m.title} href={quizHref(m._id)} />
      )}
    />
  );
}

/** Per-module quiz CTA — member-gated; renders only when the module actually
 *  has a published quiz (useQuizForTaking returns the stripped quiz or null). */
function ModuleQuizEntry({
  moduleId,
  title,
  href,
}: {
  moduleId: Id<"modules">;
  title: string;
  href: string;
}) {
  const quiz = useQuizForTaking(moduleId);
  if (quiz == null) return null; // undefined (loading) or null (no quiz)
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span>
        <span className="font-medium">Kuis:</span> {title}
      </span>
      <span className="shrink-0 text-xs font-medium text-primary">Kerjakan →</span>
    </Link>
  );
}
