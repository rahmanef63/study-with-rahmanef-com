"use client";
// materi slice — the member-gated half of the materi page.
//
// The page above this is SERVER-rendered from `publicGetBySlug` (etalase:
// title, tags, which published courses teach it) so a shared link unfurls and
// a crawler gets real HTML. This island is everything membership buys: the
// BODY, plus the live tag row and the "muncul di kelas" panel.
//
// `titleFallback` exists because the server CANNOT always render the heading:
// publicGetBySlug answers null for a DRAFT materi, and a draft is still a real
// page for its author and for instructor+. When the server had nothing, this
// renders the h1 itself from the member read.
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMembership } from "@/features/tenants";
import { MateriBacklinks } from "../components/materi-backlinks";
import { MateriBody } from "../components/materi-body";
import { MateriErrorBoundary } from "../components/materi-error-boundary";
import { TagRow } from "../components/tag-row";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { useMateri, useMateriBacklinks } from "../hooks/use-materi";
import { buildCourseHref, buildMateriPageHref, buildMateriTagHref } from "../lib/hrefs";

export type MateriDetailViewProps = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  lessonSlug: string;
  /** True when the server already emitted the <h1> from the etalase read. */
  hasServerHeading: boolean;
  /** Rendered instead of the body when the viewer is not a member. */
  gate: ReactNode;
  copy?: MateriCopyOverride;
};

function BodySkeleton() {
  return (
    <div className="space-y-4" aria-busy>
      <span className="sr-only">Memuat materi…</span>
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

function MateriContent({
  tenantSlug,
  lessonSlug,
  hasServerHeading,
  copy: copyOverride,
}: Omit<MateriDetailViewProps, "tenantId" | "gate">) {
  const copy = mergeMateriCopy(copyOverride);
  const materi = useMateri(tenantSlug, lessonSlug, true);
  // Live panel: a placement change refreshes this without re-rendering the
  // markdown above it. Falls back to the lists getBySlug already returned
  // while the second query is in flight, so the section never flickers empty.
  const live = useMateriBacklinks(materi?._id, materi !== undefined);

  if (materi === undefined) return <BodySkeleton />;

  const courses = live?.courses ?? materi.courses;
  const related = live?.materi ?? materi.backlinks;

  return (
    <article className="space-y-8">
      {hasServerHeading ? null : (
        <header className="space-y-2">
          <h1 className="text-balance text-base [overflow-wrap:anywhere] @sm:text-lg">
            {materi.title}
          </h1>
          {materi.status === "draft" ? (
            <span className="inline-block border-2 border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
              {copy.draftBadge}
            </span>
          ) : null}
        </header>
      )}

      <MateriBody
        title={materi.title}
        contentMd={materi.contentMd}
        youtubeVideoId={materi.youtubeVideoId}
        links={materi.links}
        copy={copyOverride}
      />

      <TagRow
        tags={materi.tags}
        tagHref={(tag) => buildMateriTagHref(tenantSlug, tag)}
        copy={copyOverride}
        className="border-t border-border pt-6"
      />

      <MateriBacklinks
        courses={courses}
        related={related}
        courseHref={(courseSlug) => buildCourseHref(tenantSlug, courseSlug)}
        materiHref={(slug) => buildMateriPageHref(tenantSlug, slug)}
        copy={copyOverride}
      />
    </article>
  );
}

export function MateriDetailView({
  tenantId,
  tenantSlug,
  lessonSlug,
  hasServerHeading,
  gate,
  copy: copyOverride,
}: MateriDetailViewProps) {
  const copy = mergeMateriCopy(copyOverride);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) return <BodySkeleton />;
  if (!isAuthenticated || membership === null) return <>{gate}</>;

  return (
    // NOT_FOUND here means unknown slug / deleted row / draft below instructor
    // — one code, on purpose. It must not take the whole app to app/error.tsx.
    <MateriErrorBoundary
      resetKey={lessonSlug}
      fallback={
        <div className="space-y-2 border-2 border-dashed px-4 py-8 text-center">
          <p className="text-sm">{copy.notFoundTitle}</p>
          <p className="text-pretty text-xs text-muted-foreground">{copy.notFoundBody}</p>
        </div>
      }
    >
      <MateriContent
        tenantSlug={tenantSlug}
        lessonSlug={lessonSlug}
        hasServerHeading={hasServerHeading}
        copy={copyOverride}
      />
    </MateriErrorBoundary>
  );
}
