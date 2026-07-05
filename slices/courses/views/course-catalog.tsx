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

  if (courses === undefined) {
    return (
      <div className={className ? `grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}` : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
        <Skeleton className="h-56" />
        <Skeleton className="h-56 hidden md:block" />
        <Skeleton className="h-56 hidden lg:block" />
      </div>
    );
  }

  if (courses.length === 0) {
    return <p className="text-sm text-muted-foreground">{copy.emptyCatalog}</p>;
  }

  return (
    <div className={className ? `grid gap-4 md:grid-cols-2 lg:grid-cols-3 ${className}` : "grid gap-4 md:grid-cols-2 lg:grid-cols-3"}>
      {courses.map((course) => (
        <CourseCard key={course._id} course={course} href={courseHref(course.slug)} />
      ))}
    </div>
  );
}
