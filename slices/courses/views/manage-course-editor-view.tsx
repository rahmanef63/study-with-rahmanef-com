"use client";
// courses slice — per-course editor (meta, status, PLACEMENTS).
// A course no longer owns a module tree: it holds an ordered list of materi
// placements (DECISIONS #37), so this view adds/removes/reorders placements
// and edits the materi behind them. Every write goes through the mutation
// hooks (toast on error); the server re-checks authz + invariants.
import { ArrowLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { SectionHeader } from "@/components/mockup-kit";
import { ConfirmDialog } from "../components/manage/confirm-dialog";
import { CourseForm, type CourseFormValues } from "../components/manage/course-form";
import { CourseStatusActions } from "../components/manage/course-status-actions";
import { LessonDialog } from "../components/manage/lesson-dialog";
import { MateriPicker } from "../components/manage/materi-picker";
import { PlacementList } from "../components/manage/placement-list";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { useCourseForManage, useMateriForManage } from "../hooks/use-courses";
import { useCourseMutations, usePlacementMutations } from "../hooks/use-course-mutations";
import { useLessonMutations } from "../hooks/use-lesson-mutations";

export type ManageCourseEditorViewProps = {
  courseId: Id<"courses">;
  backHref: string;
  copy?: CoursesCopyOverride;
  className?: string;
};

type LessonDialogState = { create: true } | { lessonId: Id<"lessons"> } | null;

export function ManageCourseEditorView({
  courseId,
  backHref,
  copy: copyOverride,
  className,
}: ManageCourseEditorViewProps) {
  const copy = mergeCopy(copyOverride);
  const data = useCourseForManage(courseId);
  const materi = useMateriForManage(data?.course.tenantId);
  const { updateCourse, setCourseStatus } = useCourseMutations(copyOverride);
  const placements = usePlacementMutations(copyOverride);
  const { setLessonStatus } = useLessonMutations(copyOverride);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<LessonDialogState>(null);
  const [confirmRemove, setConfirmRemove] = useState<Id<"lessons"> | null>(null);

  if (data === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const { course, lessons } = data;

  const moveLesson = (lessonId: Id<"lessons">, direction: -1 | 1) => {
    const ids = lessons.map((lesson) => lesson._id);
    const from = ids.indexOf(lessonId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setReordering(true);
    void placements.reorderCourseLessons(course._id, ids).finally(() => setReordering(false));
  };

  const handleEditCourse = async (values: CourseFormValues) => {
    setSubmitting(true);
    try {
      const id = await updateCourse({
        courseId: course._id,
        ...values,
        coverImageUrl: values.coverImageUrl ?? null,
      });
      if (id !== null) setEditOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <header className="space-y-3 border-b pb-5">
        <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
          <Link href={backHref}>
            <ArrowLeft aria-hidden /> {copy.manageTitle}
          </Link>
        </Button>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-0 flex-1">
            <span className="eyebrow">Editor kelas</span>
            <h1 className="mt-1 truncate text-2xl @sm:text-3xl">{course.title}</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="min-h-11 shrink-0 @sm:min-h-8"
            onClick={() => setEditOpen(true)}
          >
            <Pencil aria-hidden /> {copy.editCourse}
          </Button>
        </div>
        <CourseStatusActions
          courseId={course._id}
          status={course.status}
          onSetStatus={setCourseStatus}
          copy={copy}
        />
      </header>

      <section className="space-y-4">
        <SectionHeader title={copy.syllabus} as="h2" />
        <PlacementList
          lessons={lessons}
          copy={copy}
          onMove={moveLesson}
          onEdit={(lessonId) => setLessonDialog({ lessonId })}
          onSetStatus={(lessonId, status) => void setLessonStatus(lessonId, status)}
          onRemove={setConfirmRemove}
          reorderDisabled={reordering}
        />
      </section>

      <section className="space-y-3">
        <SectionHeader title={copy.addMateri} as="h2" />
        <MateriPicker
          materi={materi}
          placedLessonIds={lessons.map((lesson) => lesson._id)}
          copy={copy}
          onPick={(lessonId) => void placements.addLessonToCourse(course._id, lessonId)}
          onCreateNew={() => setLessonDialog({ create: true })}
        />
      </section>

      <ResponsiveDialog open={editOpen} onOpenChange={setEditOpen} size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{copy.editCourse}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <CourseForm
            initial={{
              title: course.title,
              slug: course.slug,
              description: course.description,
              coverImageUrl: course.coverImageUrl,
            }}
            onSubmit={handleEditCourse}
            submitting={submitting}
            copy={copy}
          />
        </ResponsiveDialogBody>
      </ResponsiveDialog>

      <LessonDialog
        open={lessonDialog !== null}
        onOpenChange={(open) => {
          if (!open) setLessonDialog(null);
        }}
        tenantId={course.tenantId}
        lessonId={lessonDialog !== null && "lessonId" in lessonDialog ? lessonDialog.lessonId : undefined}
        // Authoring from inside a course means "teach this here": place it.
        onCreated={(lessonId) => void placements.addLessonToCourse(course._id, lessonId)}
        copy={copy}
      />

      <ConfirmDialog
        open={confirmRemove !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRemove(null);
        }}
        title={copy.removeMateri}
        description={copy.removeMateriConfirm}
        confirmLabel={copy.removeMateri}
        cancelLabel={copy.cancel}
        // Unplacing is reversible and does not touch the materi or any other
        // course that teaches it — a red button here would misdescribe it.
        tone="reversible"
        onConfirm={async () => {
          if (confirmRemove === null) return;
          await placements.removeLessonFromCourse(course._id, confirmRemove);
        }}
      />
    </div>
  );
}
