"use client";

// Membership gate around QuizTakeView, mirroring lesson-surface.tsx.
//
// getQuizForTaking starts with requireMemberForQuiz, so a stranger opening a
// shared quiz URL would throw NOT_AUTHORIZED into app/error.tsx. The URL is
// public even though the data is not, so the gate is rendered, not thrown.
import type { Id } from "@convex/_generated/dataModel";
import { QuizTakeView } from "@/features/quiz";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { GabungDulu } from "../../_components/gabung-dulu";
import { communityHref } from "@/lib/community";

type Props = { slug: string; courseSlug: string; quizId: Id<"quizzes"> };

function QuizBody({ tenantId, slug, courseSlug, quizId }: Props & { tenantId: Id<"tenants"> }) {
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) {
    return <Skeleton className="h-64 w-full" />;
  }
  if (!membership) {
    return (
      <GabungDulu
        tenantId={tenantId}
        nextHref={communityHref.quiz(slug, courseSlug, quizId)}
        description="Gabung komunitasnya dulu — gratis — lalu kuisnya langsung bisa dikerjakan 🌱"
      />
    );
  }
  return <QuizTakeView quizId={quizId} />;
}

export function KuisSurface({ slug, courseSlug, quizId }: Props) {
  const tenant = useTenantBySlug(slug);
  if (tenant === undefined) return <Skeleton className="h-64 w-full" />;
  if (tenant === null) return null; // unknown community — the layout already 404s
  return <QuizBody tenantId={tenant._id} slug={slug} courseSlug={courseSlug} quizId={quizId} />;
}
