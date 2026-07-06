"use client";

import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { CourseOverviewView, useCourseOverview } from "@/features/courses";
import { CourseProgress, useCourseProgress } from "@/features/progress";
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
  const joinCtaSlot = <JoinButton tenantId={tenantId} loginHref="/login" />;

  if (overview?.viewerRole != null) {
    return (
      <MemberCourseOverview
        tenantId={tenantId}
        courseSlug={courseSlug}
        courseId={overview.course._id}
        lessonHref={lessonHref}
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
  joinCtaSlot,
}: {
  tenantId: Id<"tenants">;
  courseSlug: string;
  courseId: Id<"courses">;
  lessonHref: (lessonId: string) => string;
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
    />
  );
}
