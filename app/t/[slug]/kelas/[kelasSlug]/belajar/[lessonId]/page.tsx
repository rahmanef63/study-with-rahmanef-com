"use client";

import { use } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { LessonPlayerView } from "@/features/courses";
import { LessonCompletion } from "@/features/progress";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; kelasSlug: string; lessonId: string }>;
}) {
  const { slug, kelasSlug, lessonId } = use(params);
  const courseHref = `/t/${slug}/kelas/${kelasSlug}`;

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <LessonPlayerView
        lessonId={lessonId as Id<"lessons">}
        lessonHref={(id) => `${courseHref}/belajar/${id}`}
        backHref={courseHref}
        completionSlot={<LessonCompletion lessonId={lessonId as Id<"lessons">} />}
      />
    </div>
  );
}
