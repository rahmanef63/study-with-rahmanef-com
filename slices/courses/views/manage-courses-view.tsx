"use client";
// courses slice — /t/[slug]/kelola/kelas list view (instructor+; the
// server query is the gate). Create dialog + rows linking to the editor.
import { GraduationCap, Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ResponsiveDialog,
  ResponsiveDialogBody,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/features/responsive-dialog";
import { CourseForm, type CourseFormValues } from "../components/manage/course-form";
import { mergeCopy, type CoursesCopyOverride } from "../config/copy";
import { useManageCourses } from "../hooks/use-courses";
import { useCourseMutations } from "../hooks/use-course-mutations";

export type ManageCoursesViewProps = {
  tenantId: Id<"tenants">;
  /** Route builder for the per-course editor page. */
  courseEditorHref: (courseId: Id<"courses">) => string;
  copy?: CoursesCopyOverride;
  className?: string;
};

export function ManageCoursesView({
  tenantId,
  courseEditorHref,
  copy: copyOverride,
  className,
}: ManageCoursesViewProps) {
  const copy = mergeCopy(copyOverride);
  const courses = useManageCourses(tenantId);
  const { createCourse } = useCourseMutations(copyOverride);
  const [createOpen, setCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statusLabel = { draft: copy.statusDraft, published: copy.statusPublished, archived: copy.statusArchived };
  // status chip tokens — same palette as the editor's CourseStatusActions.
  const statusChip = {
    draft: "border-border bg-muted text-muted-foreground",
    published: "border-primary/20 bg-primary/10 text-primary",
    archived: "border-destructive/20 bg-destructive/10 text-destructive",
  } as const;

  const handleCreate = async (values: CourseFormValues) => {
    setSubmitting(true);
    try {
      const id = await createCourse({ tenantId, ...values });
      if (id !== null) setCreateOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-2">
          <span className="eyebrow">Studio kelas</span>
          <h1 className="text-2xl sm:text-3xl">{copy.manageTitle}</h1>
          <p className="max-w-prose text-pretty text-sm text-muted-foreground">
            Susun kelas, modul, dan lesson untuk komunitasmu.
          </p>
        </div>
        <Button className="min-h-11 shrink-0 sm:min-h-9" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden /> {copy.newCourse}
        </Button>
      </header>

      {courses === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : courses.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GraduationCap aria-hidden />
            </EmptyMedia>
            <EmptyTitle>{copy.emptyManageTitle}</EmptyTitle>
            <EmptyDescription>{copy.emptyManageBody}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus aria-hidden /> {copy.newCourse}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course._id}>
              <Link
                href={courseEditorHref(course._id)}
                className="block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
              >
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="min-w-0 break-words text-lg">{course.title}</CardTitle>
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusChip[course.status]}`}
                      >
                        {statusLabel[course.status]}
                      </span>
                    </div>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <ResponsiveDialog open={createOpen} onOpenChange={setCreateOpen} size="lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{copy.newCourse}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <ResponsiveDialogBody>
          <CourseForm onSubmit={handleCreate} submitting={submitting} copy={copy} />
        </ResponsiveDialogBody>
      </ResponsiveDialog>
    </div>
  );
}
