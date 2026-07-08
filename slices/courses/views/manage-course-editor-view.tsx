"use client";
// courses slice — per-course editor (meta, status, modules, lessons).
// Orchestrates the manage/* components; every write goes through the
// mutation hooks (toast on error), server re-checks authz + invariants.
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
import { AddModuleForm } from "../components/manage/add-module-form";
import { ConfirmDialog } from "../components/manage/confirm-dialog";
import { CourseForm, type CourseFormValues } from "../components/manage/course-form";
import { CourseStatusActions } from "../components/manage/course-status-actions";
import { LessonDialog } from "../components/manage/lesson-dialog";
import { ModuleEditor } from "../components/manage/module-editor";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { useCourseTree } from "../hooks/use-courses";
import { useCourseMutations, useModuleMutations } from "../hooks/use-course-mutations";
import { useLessonMutations } from "../hooks/use-lesson-mutations";

export type ManageCourseEditorViewProps = {
  courseId: Id<"courses">;
  backHref: string;
  copy?: CoursesCopyOverride;
  className?: string;
};

type LessonDialogState = { moduleId?: Id<"modules">; lessonId?: Id<"lessons"> } | null;
type ConfirmState = { kind: "module" | "lesson"; id: string } | null;

export function ManageCourseEditorView({ courseId, backHref, copy: copyOverride, className }: ManageCourseEditorViewProps) {
  const copy = mergeCopy(copyOverride);
  const tree = useCourseTree(courseId);
  const { updateCourse, setCourseStatus } = useCourseMutations(copyOverride);
  const moduleMutations = useModuleMutations(copyOverride);
  const lessonMutations = useLessonMutations(copyOverride);
  const [editOpen, setEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [lessonDialog, setLessonDialog] = useState<LessonDialogState>(null);
  const [confirmDelete, setConfirmDelete] = useState<ConfirmState>(null);

  if (tree === undefined) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  const moveModule = (moduleId: Id<"modules">, direction: -1 | 1) => {
    const ids = tree.modules.map((mod) => mod._id);
    const from = ids.indexOf(moduleId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setReordering(true);
    void moduleMutations.reorderModules(tree.course._id, ids).finally(() => setReordering(false));
  };

  const moveLesson = (moduleId: Id<"modules">, lessonId: Id<"lessons">, direction: -1 | 1) => {
    const mod = tree.modules.find((m) => m._id === moduleId);
    if (mod === undefined) return;
    const ids = mod.lessons.map((lesson) => lesson._id);
    const from = ids.indexOf(lessonId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setReordering(true);
    void lessonMutations.reorderLessons(moduleId, ids).finally(() => setReordering(false));
  };

  const handleEditCourse = async (values: CourseFormValues) => {
    setSubmitting(true);
    try {
      const id = await updateCourse({
        courseId: tree.course._id,
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
            <h1 className="mt-1 truncate text-2xl @sm:text-3xl">{tree.course.title}</h1>
          </div>
          <Button variant="outline" size="sm" className="min-h-11 shrink-0 @sm:min-h-8" onClick={() => setEditOpen(true)}>
            <Pencil aria-hidden /> {copy.editCourse}
          </Button>
        </div>
        <CourseStatusActions
          courseId={tree.course._id}
          status={tree.course.status}
          onSetStatus={setCourseStatus}
          copy={copy}
        />
      </header>

      <section className="space-y-4">
        {tree.modules.map((mod, index) => (
          <ModuleEditor
            key={mod._id}
            module={mod}
            index={index}
            total={tree.modules.length}
            copy={copy}
            onRename={moduleMutations.renameModule}
            onMove={moveModule}
            onDelete={(id) => setConfirmDelete({ kind: "module", id })}
            onAddLesson={(moduleId) => setLessonDialog({ moduleId })}
            onEditLesson={(lessonId) => setLessonDialog({ lessonId })}
            onDeleteLesson={(id) => setConfirmDelete({ kind: "lesson", id })}
            onMoveLesson={moveLesson}
            reorderDisabled={reordering}
          />
        ))}
        <AddModuleForm
          courseId={tree.course._id}
          onCreate={moduleMutations.createModule}
          copy={copy}
        />
      </section>

      <ResponsiveDialog open={editOpen} onOpenChange={setEditOpen} size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{copy.editCourse}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <CourseForm
            initial={{
              title: tree.course.title,
              slug: tree.course.slug,
              description: tree.course.description,
              coverImageUrl: tree.course.coverImageUrl,
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
        moduleId={lessonDialog?.moduleId}
        lessonId={lessonDialog?.lessonId}
        copy={copy}
      />

      <ConfirmDialog
        open={confirmDelete !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmDelete(null);
        }}
        title={confirmDelete?.kind === "module" ? copy.deleteModule : copy.deleteLesson}
        description={copy.deleteConfirm}
        confirmLabel={confirmDelete?.kind === "module" ? copy.deleteModule : copy.deleteLesson}
        cancelLabel={copy.cancel}
        onConfirm={async () => {
          if (confirmDelete === null) return;
          if (confirmDelete.kind === "module") {
            await moduleMutations.deleteModule(confirmDelete.id as Id<"modules">);
          } else {
            await lessonMutations.deleteLesson(confirmDelete.id as Id<"lessons">);
          }
        }}
      />
    </div>
  );
}
