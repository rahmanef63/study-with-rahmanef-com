"use client";
// courses slice — published-course grid (tenant home; landing #5 reuses
// CourseCard directly for its own layout). Reactive via useQuery.
// TODO(rr): integrator may upgrade the mounting page to preloadQuery →
// usePreloadedQuery (rr data-fetching P1) once codegen types land; the
// presentational <CourseCard/> already supports that path.
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { CourseCard } from "../components/course-card";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { usePublishedCourses } from "../hooks/use-courses";

export type CourseCatalogProps = {
  tenantId: Id<"tenants">;
  /** Route builder: (courseSlug) => `/t/${tenantSlug}/kelas/${courseSlug}`. */
  courseHref: (courseSlug: string) => string;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function CourseCatalog({ tenantId, courseHref, copy: copyOverride, className }: CourseCatalogProps) {
  const copy = mergeCopy(copyOverride);
  const courses = usePublishedCourses(tenantId);

  const gridClass = "grid gap-4 @sm:grid-cols-2 @lg:grid-cols-3";

  if (courses === undefined) {
    return (
      <div className={className ? `${gridClass} ${className}` : gridClass}>
        <Skeleton className="h-56" />
        <Skeleton className="hidden h-56 @sm:block" />
        <Skeleton className="hidden h-56 @lg:block" />
      </div>
    );
  }

  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyCatalog}</p>;
  }

  return (
    <div className={className ? `${gridClass} ${className}` : gridClass}>
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} href={courseHref(course.slug)} />
      ))}
    </div>
  );
}
