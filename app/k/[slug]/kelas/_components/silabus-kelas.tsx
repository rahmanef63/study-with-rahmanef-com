"use client";

// The interactive course overview. Nothing about the silabus is reimplemented:
// this only resolves tenant + membership and feeds CourseOverviewView its
// slots. It has to be a client island because membership (viewerRole) is only
// knowable over the authenticated socket — server components here are always
// anonymous, and a function prop (the href builders below) cannot cross the
// server→client boundary at all.
//
// MATERI MODEL (DECISIONS #37): the silabus is a FLAT ordered list of materi,
// and the course's quizzes are its last rows — there is no module to hang a
// quiz CTA on any more.
import type { Id } from "@convex/_generated/dataModel";
import { CourseOverviewView, useCourseOverview } from "@/features/courses";
import { CourseProgress, useCourseProgress } from "@/features/progress";
import { CourseQuizList } from "@/features/quiz";
import { JoinButton, useTenantBySlug } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { SumberBelajarCard } from "./sumber-belajar-card";

type Target = { slug: string; courseSlug: string };

function SilabusSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

/** Member view — layers progress (ring + ticks) and the course's quizzes onto
 *  the shared overview. Mounts only for members, so the member-gated progress
 *  and quiz queries never fire for anonymous viewers. */
function MemberSilabus({
  tenantId,
  courseId,
  slug,
  courseSlug,
}: Target & { tenantId: Id<"tenants">; courseId: Id<"courses"> }) {
  const progress = useCourseProgress(courseId);
  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={(lessonId) => communityHref.lesson(slug, courseSlug, lessonId)}
      completedLessonIds={progress?.completedLessonIds}
      progressSlot={<CourseProgress courseId={courseId} />}
      aboveSyllabusSlot={<SumberBelajarCard slug={slug} />}
      quizSlot={
        <CourseQuizList
          courseId={courseId}
          quizHref={(quizId) => communityHref.quiz(slug, courseSlug, quizId)}
        />
      }
    />
  );
}

function SilabusBody({ tenantId, slug, courseSlug }: Target & { tenantId: Id<"tenants"> }) {
  // Deduped with CourseOverviewView's own read (same Convex query + args); we
  // need it here to branch on membership and to reach course._id for progress.
  const overview = useCourseOverview(tenantId, courseSlug);
  if (overview === undefined) return <SilabusSkeleton />;

  if (overview.viewerRole != null) {
    return (
      <MemberSilabus
        tenantId={tenantId}
        courseId={overview.course._id}
        slug={slug}
        courseSlug={courseSlug}
      />
    );
  }

  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={(lessonId) => communityHref.lesson(slug, courseSlug, lessonId)}
      joinCtaSlot={
        <JoinButton
          tenantId={tenantId}
          loginHref={`/masuk?next=${encodeURIComponent(communityHref.course(slug, courseSlug))}`}
        />
      }
      aboveSyllabusSlot={<SumberBelajarCard slug={slug} />}
    />
  );
}

export function SilabusKelas({ slug, courseSlug }: Target) {
  const tenant = useTenantBySlug(slug);
  if (tenant === undefined) return <SilabusSkeleton />;
  // An unknown community already 404s in the layout; nothing useful to add here.
  if (tenant === null) return null;
  return <SilabusBody tenantId={tenant._id} slug={slug} courseSlug={courseSlug} />;
}
