"use client";

import { use } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { QuizBuilderView } from "@/features/quiz";
import { useTenantBySlug } from "@/features/tenants";

// #8 mount — builder quiz per modul (instructor+; server authz di mutations).
export default function QuizBuilderPage({
  params,
}: {
  params: Promise<{ slug: string; courseId: string; moduleId: string }>;
}) {
  const { slug, courseId, moduleId } = use(params);
  const tenant = useTenantBySlug(slug);
  if (tenant === undefined) return <Skeleton className="mx-auto my-10 h-64 max-w-4xl" />;
  if (tenant === null) return null;
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <QuizBuilderView
        moduleId={moduleId as Id<"modules">}
        courseId={courseId as Id<"courses">}
        tenantId={tenant._id}
      />
    </div>
  );
}
