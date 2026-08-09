"use client";

// Kelola › Kelas — reuses the real courses management views end-to-end:
//   list + create dialog + status chips        → ManageCoursesView
//   per-course editor (meta/modules/lessons)   → ManageCourseEditorView
// Both views navigate via <Link>, but the console is ONE page with local tabs:
// following a real route would drop the instructor out of it and lose the
// active tab. So the drill-down stays React state and the anchor clicks are
// cancelled in the capture phase — Next's Link handler bails when
// e.defaultPrevented. No CRUD is reimplemented here.
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
