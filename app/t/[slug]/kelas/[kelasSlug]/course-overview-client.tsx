"use client";

import type { Id } from "@convex/_generated/dataModel";
import { CourseOverviewView } from "@/features/courses";
import { JoinButton } from "@/features/tenants";

export function CourseOverviewClient({
  tenantId,
  tenantSlug,
  courseSlug,
}: {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  courseSlug: string;
}) {
  return (
    <CourseOverviewView
      tenantId={tenantId}
      courseSlug={courseSlug}
      lessonHref={(lessonId) =>
        `/t/${tenantSlug}/kelas/${courseSlug}/belajar/${lessonId}`
      }
      joinCtaSlot={<JoinButton tenantId={tenantId} loginHref="/login" />}
    />
  );
}
