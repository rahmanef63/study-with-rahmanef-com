"use client";
// Kelola › Kelas tab — reuses the real courses management views end-to-end:
//   list + create dialog + status chips  →  ManageCoursesView
//   per-course editor (meta/modules/lessons/status)  →  ManageCourseEditorView
// Both views navigate via <Link>. Inside the OS window a route change would
// tear down the whole desktop, so we intercept those anchor clicks in the
// capture phase — calling preventDefault there cancels Next's Link handler
// (it bails when e.defaultPrevented) — and drive an in-window drill-down via
// React state instead. No CRUD is reimplemented here.
import { useState, type MouseEvent } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { ManageCourseEditorView, ManageCoursesView } from "@/features/courses";

const COURSE_HREF_PREFIX = "#kelola-course-";
const BACK_HREF = "#kelola-kelas";

export function KelolaKelasTab({ tenantId }: { tenantId: Id<"tenants"> }) {
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);

  if (courseId === null) {
    const onListClick = (e: MouseEvent<HTMLDivElement>) => {
      const href = (e.target as HTMLElement).closest("a")?.getAttribute("href");
      if (href && href.startsWith(COURSE_HREF_PREFIX)) {
        e.preventDefault();
        setCourseId(href.slice(COURSE_HREF_PREFIX.length) as Id<"courses">);
      }
    };
    return (
      <div onClickCapture={onListClick}>
        <ManageCoursesView
          tenantId={tenantId}
          courseEditorHref={(id) => `${COURSE_HREF_PREFIX}${id}`}
        />
      </div>
    );
  }

  const onEditorClick = (e: MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("a")?.getAttribute("href") === BACK_HREF) {
      e.preventDefault();
      setCourseId(null);
    }
  };
  return (
    <div onClickCapture={onEditorClick}>
      <ManageCourseEditorView courseId={courseId} backHref={BACK_HREF} />
    </div>
  );
}
