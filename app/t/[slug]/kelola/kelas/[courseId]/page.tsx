"use client";

import { use } from "react";
import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ManageCourseEditorView, useCourseTree } from "@/features/courses";

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
      <QuizLinks slug={slug} courseId={courseId as Id<"courses">} />
    </div>
  );
}

// #8 integration (alpha): per-module quiz builder entries under the editor.
function QuizLinks({ slug, courseId }: { slug: string; courseId: Id<"courses"> }) {
  const tree = useCourseTree(courseId);
  if (!tree || tree.modules.length === 0) return null;
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-semibold">Quiz per modul</h2>
      <ul className="space-y-2">
        {tree.modules.map((mod) => (
          <li key={mod._id} className="flex items-center justify-between rounded-md border px-4 py-2">
            <span className="text-sm">{mod.title}</span>
            <Button asChild size="sm" variant="outline">
              <Link href={`/t/${slug}/kelola/kelas/${courseId}/quiz/${mod._id}`}>
                Kelola quiz
              </Link>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
