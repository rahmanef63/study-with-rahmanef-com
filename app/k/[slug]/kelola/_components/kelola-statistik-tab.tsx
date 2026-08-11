"use client";

// Kelola › Statistik — the instructor's numbers. Two questions, in the order an
// instructor actually asks them:
//
//   1. IS ANYONE HERE? — TenantPulseView: members, who showed up this week, what
//      got finished, and which materi nobody has ever opened.
//   2. WHERE DO THEY STOP? — pick a course, get its drop-off (CourseAnalyticsView,
//      which leads with CourseFunnelView).
//
// The tab is still called "Statistik" and not "Insight": the label is asserted
// by e2e/kelola.auth.spec.ts C1, it is already the Bahasa word an instructor
// looks for, and a second numbers tab beside it would split one question across
// two screens. The Insight capability lives INSIDE it.
//
// Every number here is derived server-side under instructor+ authz (bounded
// takes, no bare .collect()); this tab is just the mount.
import { useState } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  CourseAnalyticsView,
  TenantPulseView,
  useCourseSummaries,
  type CourseSummaryData,
} from "@/features/analytics";
import { communityHref } from "@/lib/community";

function CourseList({
  summaries,
  courseId,
  onToggle,
}: {
  summaries: CourseSummaryData[];
  courseId: Id<"courses"> | null;
  onToggle: (id: Id<"courses">) => void;
}) {
  return (
    <ul className="space-y-2">
      {summaries.map((s) => {
        const active = courseId === s.courseId;
        return (
          <li
            key={s.courseId}
            className="flex flex-wrap items-center justify-between gap-3 border px-4 py-3"
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
              className="min-h-11"
              onClick={() => onToggle(s.courseId)}
            >
              {active ? "Tutup detail" : "Lihat detail"}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function KelolaStatistikTab({
  tenantId,
  slug,
}: {
  tenantId: Id<"tenants">;
  slug: string;
}) {
  const summaries = useCourseSummaries(tenantId);
  const [courseId, setCourseId] = useState<Id<"courses"> | null>(null);

  return (
    <div className="space-y-8">
      {/* The pulse renders even with no courses: "nobody has read anything" is
          exactly the answer a community with an empty catalogue needs. */}
      <TenantPulseView
        tenantId={tenantId}
        // A client→client function prop, which is fine — this whole console is
        // one client island. It never crosses the server boundary.
        materiHref={(lessonSlug) => communityHref.materiPage(slug, lessonSlug)}
      />

      <section className="space-y-3">
        <h3 className="text-title font-medium">Per kelas</h3>
        {summaries === undefined ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : summaries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Belum ada kelas untuk dianalisis — buat kelas dulu di tab Kelas.
          </p>
        ) : (
          <CourseList
            summaries={summaries}
            courseId={courseId}
            onToggle={(id) => setCourseId(courseId === id ? null : id)}
          />
        )}
        {courseId ? <CourseAnalyticsView courseId={courseId} /> : null}
      </section>
    </div>
  );
}
