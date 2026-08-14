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
//
// ONE VIEW FOR BOTH KINDS. A skill page is this page with a prompt panel on
// top: same body, same tag row, same "muncul di", same error boundary. The
// `kind` prop only says which route MOUNTED it — it picks the not-found copy
// and the tag targets. What actually renders the panel is the ROW'S own kind
// coming back from the server, so a mismatch (see the redirect in both
// permalink pages) can never produce a prompt panel on a materi.
import type { ReactNode } from "react";
import type { Id } from "@convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMembership } from "@/features/tenants";
import { MateriBacklinks } from "../components/materi-backlinks";
import { MateriBody } from "../components/materi-body";
import { MateriErrorBoundary } from "../components/materi-error-boundary";
import { PromptPanel } from "../components/prompt-panel";
import { TagRow } from "../components/tag-row";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { useMateri, useMateriBacklinks } from "../hooks/use-materi";
import {
  buildCourseHref,
  buildKindPageHref,
  buildMateriTagHref,
  buildSkillTagHref,
} from "../lib/hrefs";
import type { MateriKind } from "../types";

export type MateriDetailViewProps = {
  tenantId: Id<"tenants">;
  tenantSlug: string;
  lessonSlug: string;
  /** True when the server already emitted the <h1> from the etalase read. */
  hasServerHeading: boolean;
  /** Which route mounted this — "materi" (default) or "skill". Chooses the
   *  not-found copy and where a tag links back to. It does NOT decide whether
   *  the prompt panel renders; the row's own `kind` does. */
  kind?: MateriKind;
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
  kind = "materi",
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
            <span className="inline-block border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
              {copy.draftBadge}
            </span>
          ) : null}
        </header>
      )}

      {/* THE HERO, above the body: a skill exists to be taken away, and the
          explanation below it is context for a decision usually already made.
          Driven by the ROW'S kind, never by the route's — a materi has no
          promptText to render even if someone mounts this at /skills. */}
      {materi.kind === "skill" ? (
        <PromptPanel promptText={materi.promptText} copy={copyOverride} />
      ) : null}

      <MateriBody
        title={materi.title}
        contentMd={materi.contentMd}
        youtubeVideoId={materi.youtubeVideoId}
        links={materi.links}
        copy={copyOverride}
      />

      <TagRow
        tags={materi.tags}
        // A tag goes back to the library the READER came from: from a skill,
        // "prompt-engineering" means "the other skills like this", not the
        // whole materi shelf. Both libraries read the same tag cloud.
        tagHref={(tag) =>
          kind === "skill" ? buildSkillTagHref(tenantSlug, tag) : buildMateriTagHref(tenantSlug, tag)
        }
        copy={copyOverride}
        className="border-t border-border pt-6"
      />

      <MateriBacklinks
        courses={courses}
        related={related}
        courseHref={(courseSlug) => buildCourseHref(tenantSlug, courseSlug)}
        // `MateriRef` carries no `kind` — the backlink projection is
        // {_id, slug, title} and widening a server type is not this agent's
        // file. So a related SKILL links at /materi/<slug> and the permalink
        // page redirects it to /skills/<slug>: one extra hop, never a dead
        // end, which is precisely the case the redirect was built for.
        materiHref={(slug) => buildKindPageHref(tenantSlug, "materi", slug)}
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
  kind = "materi",
  gate,
  copy: copyOverride,
}: MateriDetailViewProps) {
  const copy = mergeMateriCopy(copyOverride);
  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);

  if (isAuthLoading || (isAuthenticated && membership === undefined)) return <BodySkeleton />;
  if (!isAuthenticated || membership === null) return <>{gate}</>;

  const isSkill = kind === "skill";
  return (
    // NOT_FOUND here means unknown slug / deleted row / draft below instructor
    // — one code, on purpose. It must not take the whole app to app/error.tsx.
    <MateriErrorBoundary
      resetKey={lessonSlug}
      fallback={
        <div className="space-y-2 border border-dashed px-4 py-8 text-center">
          <p className="text-sm">{isSkill ? copy.skillNotFoundTitle : copy.notFoundTitle}</p>
          <p className="text-pretty text-xs text-muted-foreground">
            {isSkill ? copy.skillNotFoundBody : copy.notFoundBody}
          </p>
        </div>
      }
    >
      <MateriContent
        tenantSlug={tenantSlug}
        lessonSlug={lessonSlug}
        hasServerHeading={hasServerHeading}
        kind={kind}
        copy={copyOverride}
      />
    </MateriErrorBoundary>
  );
}
