"use client";

import type { Id } from "@convex/_generated/dataModel";
import { ManageCoursesView } from "@/features/courses";

export function ManageCoursesClient({ tenantId, slug }: { tenantId: Id<"tenants">; slug: string }) {
  return (
    <ManageCoursesView
      tenantId={tenantId}
      courseEditorHref={(courseId) => `/t/${slug}/kelola/kelas/${courseId}`}
    />
  );
}
