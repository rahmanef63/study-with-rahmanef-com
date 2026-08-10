"use client";

// Membership gate around QuizTakeView, mirroring lesson-surface.tsx.
//
// getQuizForTaking starts with requireMemberForModule, so a stranger opening a
// shared quiz URL would throw NOT_AUTHORIZED into app/error.tsx. In the OS this
// could not happen — the Kuis window was only ever spawned from a member-only
// module footer — but on a real route the URL is public even though the data
// is not.
import type { Id } from "@convex/_generated/dataModel";
import { QuizTakeView } from "@/features/quiz";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";
import { Skeleton } from "@/components/ui/skeleton";
import { GabungDulu } from "../../_components/gabung-dulu";
import { communityHref } from "@/lib/community";

type Props = { slug: string; courseSlug: string; moduleId: Id<"modules"> };

function QuizBody({ tenantId, slug, courseSlug, moduleId }: Props & { tenantId: Id<"tenants"> }) {
 const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

 if (isAuthLoading || (isAuthenticated && membership === undefined)) {
 return <Skeleton className="h-64 w-full " />;
  }
 if (!membership) {
 return (
      <GabungDulu
 tenantId={tenantId}
 nextHref={communityHref.quiz(slug, courseSlug, moduleId)}
 description="Gabung komunitasnya dulu — gratis — lalu kuisnya langsung bisa dikerjakan 🌱"
      />
    );
  }
 return <QuizTakeView moduleId={moduleId} />;
}

export function KuisSurface({ slug, courseSlug, moduleId }: Props) {
 const tenant = useTenantBySlug(slug);
 if (tenant === undefined) return <Skeleton className="h-64 w-full " />;
 if (tenant === null) return null; // unknown community — the layout already 404s
 return (
    <QuizBody tenantId={tenant._id} slug={slug} courseSlug={courseSlug} moduleId={moduleId} />
  );
}
