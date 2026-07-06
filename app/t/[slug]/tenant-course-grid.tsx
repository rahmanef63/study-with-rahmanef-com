"use client";

// Member-aware course grid for the tenant home (UI-UX-PRD §4: "progress ring
// utk member"). Members get a per-course progress bar via the member-gated
// useCourseProgress (probed once membership is known); everyone else gets the
// plain etalase card. No backend change — reuses the existing progress query.
import type { Id } from "@convex/_generated/dataModel";
import { CourseCard, type CourseCardData } from "@/features/courses";
import { useCourseProgress } from "@/features/progress";
import { useMyMembership } from "@/features/tenants";

export function TenantCourseGrid({
  courses,
  tenantId,
  slug,
}: {
  courses: CourseCardData[];
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const { membership } = useMyMembership(tenantId);
  const isMember = membership != null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {courses.map((course) => {
        const href = `/t/${slug}/kelas/${course.slug}`;
        return isMember ? (
          <MemberCourseCard key={course._id} course={course} href={href} />
        ) : (
          <CourseCard key={course._id} course={course} href={href} />
        );
      })}
    </div>
  );
}

function MemberCourseCard({ course, href }: { course: CourseCardData; href: string }) {
  const progress = useCourseProgress(course._id);
  return (
    <CourseCard
      course={course}
      href={href}
      progress={
        progress
          ? { completedCount: progress.completedCount, totalCount: progress.totalCount }
          : undefined
      }
    />
  );
}
