import type { Metadata } from "next";
import { Suspense } from "react";
import { api } from "@convex/_generated/api";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Skeleton } from "@/components/ui/skeleton";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { absoluteUrl } from "@/lib/site";
import { SilabusKelas } from "../_components/silabus-kelas";

// Silabus — the course overview. The silabus is public etalase, so the title,
// description and materi titles are server-rendered for crawlers and metadata;
// everything membership-aware (progress, quizzes, join) hydrates in
// <SilabusKelas/> below.
//
// MATERI MODEL (DECISIONS #37): getOverview returns a FLAT ordered materi list
// — there is no module tree left to nest here.
type Params = { slug: string; courseSlug: string };

/** getOverview keys on tenantId, so this is two serial anonymous reads:
 *  slug → tenant → overview. Both sit on the etalase whitelist (AGENTS.md §6).
 *  A draft course reads as null here (the query hides drafts from anonymous
 *  callers) — that is left to the client view, which sees the instructor's own
 *  role over the authenticated socket. */
async function getKelas(slug: string, courseSlug: string) {
  const tenant = await safeQuery(api.features.tenants.queries.getPublicBySlug, { slug });
  if (tenant === null) return null;
  return safeQuery(api.features.courses.queries.getOverview, {
    tenantId: tenant._id,
    courseSlug,
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, courseSlug } = await params;
  const overview = await getKelas(slug, courseSlug);
  const path = communityHref.course(slug, courseSlug);
  if (overview === null) {
    // Unpublished or unreachable — never index a page whose content we cannot
    // even read, and never guess a title from the slug.
    return { title: "Kelas", alternates: { canonical: path }, robots: { index: false } };
  }
  const { title, description } = overview.course;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "article", title, description, url: absoluteUrl(path) },
    twitter: { card: "summary_large_image", title, description },
  };
}

/**
 * Server copy of the course: the same title/description/silabus the hydrated
 * view renders, in the HTML response.
 *
 * Visually hidden AND out of the a11y tree on purpose — <CourseOverviewView>
 * below re-renders all of it inside its own <Hero>, so showing this too would
 * print the course title twice and announce two <h1>s. The share button is the
 * one visible part: it needs the course title, which only this read knows.
 */
async function KelasHeader({ slug, courseSlug }: Params) {
  const overview = await getKelas(slug, courseSlug);
  if (overview === null) return null;
  const { course, lessons } = overview;
  return (
    <div className="mb-4">
      <div className="sr-only" aria-hidden>
        <h1>{course.title}</h1>
        {course.description ? <p>{course.description}</p> : null}
        <ol>
          {lessons.map((lesson) => (
            <li key={lesson._id}>{lesson.title}</li>
          ))}
        </ol>
      </div>
      <div className="flex justify-end">
        <TombolBagikan
          url={absoluteUrl(communityHref.course(slug, courseSlug))}
          title={course.title}
          text={course.description}
          variant="ghost"
        />
      </div>
    </div>
  );
}

export default async function SilabusPage({ params }: { params: Promise<Params> }) {
  const { slug, courseSlug } = await params;
  return (
    // @container: the reused slice views size to their CONTAINER, never the
    // viewport, so they need a container context to lay out past one column.
    <div className="@container">
      {/* Own boundary: the etalase reads are dynamic (cacheComponents). */}
      <Suspense fallback={<Skeleton className="mb-4 ml-auto h-9 w-28" />}>
        <KelasHeader slug={slug} courseSlug={courseSlug} />
      </Suspense>
      <SilabusKelas slug={slug} courseSlug={courseSlug} />
    </div>
  );
}
