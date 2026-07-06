"use client";

import { use } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { LessonPlayerView } from "@/features/courses";
import { LessonCompletion } from "@/features/progress";
import { LessonSyllabusAside } from "./lesson-syllabus-aside";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; kelasSlug: string; lessonId: string }>;
}) {
  const { slug, kelasSlug, lessonId } = use(params);
  const courseHref = `/t/${slug}/kelas/${kelasSlug}`;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <LessonSyllabusAside
        slug={slug}
        courseSlug={kelasSlug}
        currentLessonId={lessonId as Id<"lessons">}
        className="hidden lg:block"
      />
      <div className="min-w-0">
        <LessonPlayerView
          lessonId={lessonId as Id<"lessons">}
          lessonHref={(id) => `${courseHref}/belajar/${id}`}
          backHref={courseHref}
          completionSlot={<LessonCompletion lessonId={lessonId as Id<"lessons">} />}
        />
      </div>
    </div>
  );
}
