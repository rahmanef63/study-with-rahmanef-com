"use client";

import { use } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { ManageCourseEditorView } from "@/features/courses";

export default function KelolaKelasEditorPage({
  params,
}: {
  params: Promise<{ slug: string; courseId: string }>;
}) {
  const { slug, courseId } = use(params);
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <ManageCourseEditorView
        courseId={courseId as Id<"courses">}
        backHref={`/t/${slug}/kelola/kelas`}
      />
    </div>
  );
}
