import type { Metadata } from "next";
import type { Id } from "@convex/_generated/dataModel";
import { LessonSurface } from "../../_components/lesson-surface";

// Lesson player. Everything on this route is member-gated (getLesson requires
// membership), so there is nothing for an anonymous server component to render
// and nothing for a crawler to index: a static title keeps a private course's
// lesson names out of the metadata, and noindex keeps the empty gate out of
// search results. The URL stays shareable — that is the point of the route.
export const metadata: Metadata = { title: "Materi", robots: { index: false } };

type Params = { slug: string; courseSlug: string; lessonId: string };

export default async function LessonPage({ params }: { params: Promise<Params> }) {
  const { slug, courseSlug, lessonId } = await params;
  return (
    // @container: the reused slice views (and the rail/content split below)
    // size to their CONTAINER, never the viewport.
    <div className="@container">
      <LessonSurface
        slug={slug}
        courseSlug={courseSlug}
        // A malformed id is rejected by the Convex validator, which surfaces as
        // the route error boundary — same as every other id-in-URL route here.
        lessonId={lessonId as Id<"lessons">}
      />
    </div>
  );
}
