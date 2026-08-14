import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { api } from "@convex/_generated/api";
import { safeQuery } from "@/lib/convex-server";
import { DEFAULT_COMMUNITY_SLUG, communityHref } from "@/lib/community";
import { CourseCover } from "@/features/courses";

// The catalogue, on the front door.
//
// A landing page that describes a product without showing it asks the reader to
// take its word. These are the real published courses, read from the anonymous
// etalase, so the page cannot advertise a course that has been unpublished — and
// a crawler gets six more internal links into the content it should be indexing.
//
// Its own component, and its own Suspense boundary at the call site, so the
// Convex round trip cannot hold up the hero: the headline and the CTAs are the
// part that has to paint immediately.
export async function LandingCourses() {
  const tenants = (await safeQuery(api.features.tenants.queries.listActive, {})) ?? [];
  const flagship = tenants.find((t) => t.slug === DEFAULT_COMMUNITY_SLUG);
  if (flagship === undefined) return null;

  const courses =
    (await safeQuery(api.features.courses.queries.listPublished, { tenantId: flagship._id })) ?? [];
  if (courses.length === 0) return null;

  return (
    <section className="border-t py-8 md:py-10">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="eyebrow">Kelas yang sudah jalan</h2>
        <Link
          href={communityHref.home(DEFAULT_COMMUNITY_SLUG)}
          className="inline-flex min-h-11 items-center gap-1.5 text-footnote text-muted-foreground hover:text-primary"
        >
          Semua kelas
          <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>

      {/* Two columns at 390px, the same density the community's own list uses —
          six covers clear the fold instead of two. */}
      <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        {courses.map((course) => (
          <li key={course._id}>
            <Link
              href={communityHref.course(DEFAULT_COMMUNITY_SLUG, course.slug)}
              className="group flex h-full flex-col rounded-[var(--radius)] border border-border bg-card transition-colors hover:border-primary"
            >
              {/* The procedural cover: a different one per course, derived from
                  the slug, so course seven gets art with no upload. */}
              <CourseCover
                slug={course.slug}
                src={course.coverImageUrl}
                className="aspect-[2/1] w-full border-b border-border"
              />
              <span className="line-clamp-3 p-3 text-title font-medium leading-snug group-hover:text-primary">
                {course.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
