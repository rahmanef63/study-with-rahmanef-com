"use client";
// Kelola › Statistik (#20) — instructor analytics: per-course summaries from
// the analytics slice (#17), with a drill-down into CourseAnalyticsView.
// All data is derived server-side (bounded takes); instructor+ gated in the
// Convex functions themselves — this tab is just the mount.
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CourseAnalyticsView,
  useCourseSummaries,
  type CourseSummaryData,
} from "@/features/analytics";

export function KelolaStatistikTab({ tenantId }: { tenantId: Id<"tenants"> }) {
  const summaries = useCourseSummaries(tenantId);
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);

  if (summaries === undefined) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16" />
        <Skeleton className="h-16" />
      </div>
    );
  }
  if (summaries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Belum ada kelas untuk dianalisis — buat kelas dulu di tab Kelas.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {summaries.map((s: CourseSummaryData) => {
          const active = courseId === s.courseId;
          return (
            <li
              key={s.courseId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{s.title}</p>
                <p className="text-sm text-muted-foreground">
                  {s.completionCount} penyelesaian · {s.memberCount} anggota komunitas
                </p>
              </div>
              <Button
                size="sm"
                variant={active ? "default" : "outline"}
                onClick={() => setCourseId(active ? null : s.courseId)}
              >
                {active ? "Tutup detail" : "Lihat detail"}
              </Button>
            </li>
          );
        })}
      </ul>
      {courseId && <CourseAnalyticsView courseId={courseId} />}
    </div>
  );
}
