"use client";

import { use, useState } from "react";
import { PanelLeft } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { LessonPlayerView } from "@/features/courses";
import { LessonCompletion } from "@/features/progress";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { LessonSyllabusAside } from "./lesson-syllabus-aside";

export default function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; kelasSlug: string; lessonId: string }>;
}) {
  const { slug, kelasSlug, lessonId } = use(params);
  const courseHref = `/t/${slug}/kelas/${kelasSlug}`;
  const [syllabusOpen, setSyllabusOpen] = useState(false);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
      <LessonSyllabusAside
        slug={slug}
        courseSlug={kelasSlug}
        currentLessonId={lessonId as Id<"lessons">}
        className="hidden lg:block"
      />
      <div className="min-w-0">
        <Button
          type="button"
          variant="outline"
          onClick={() => setSyllabusOpen(true)}
          aria-label="Buka silabus"
          className="mb-4 h-11 gap-2 lg:hidden"
        >
          <PanelLeft aria-hidden className="size-4" />
          Silabus
        </Button>
        <LessonPlayerView
          lessonId={lessonId as Id<"lessons">}
          lessonHref={(id) => `${courseHref}/belajar/${id}`}
          backHref={courseHref}
          completionSlot={<LessonCompletion lessonId={lessonId as Id<"lessons">} />}
        />
      </div>

      <ResponsiveDialog
        open={syllabusOpen}
        onOpenChange={setSyllabusOpen}
        variant="panel"
        sheetSide="left"
        mobileVariant="drawer-bottom"
      >
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>Silabus</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <LessonSyllabusAside
            slug={slug}
            courseSlug={kelasSlug}
            currentLessonId={lessonId as Id<"lessons">}
            hideLabel
          />
        </ResponsiveDialogBody>
      </ResponsiveDialog>
    </div>
  );
}
