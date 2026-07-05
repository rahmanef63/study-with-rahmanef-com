"use client";
// courses slice — /t/[slug]/kelola/kelas list view (instructor+; the
// server query is the gate). Create dialog + rows linking to the editor.
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{copy.manageTitle}</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden /> {copy.newCourse}
        </Button>
      </div>

      {courses === undefined ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.emptyCatalog}</p>
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course._id}>
              <Link href={courseEditorHref(course._id)} className="block">
                <Card className="transition-colors hover:border-primary/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <span className="shrink-0 rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
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
