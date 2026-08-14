// materi slice — the SERVER-rendered etalase header of a permalink page.
//
// No "use client": this is the half of /materi/<slug> and /skills/<slug> that
// exists for a crawler and for the logged-out person who was handed the link
// in WhatsApp. It renders from `publicGetBySlug` — title, tags, date, share —
// and stops exactly there. The body, and on a skill the PROMPT, live in the
// member-gated island below it.
//
// Shared by both permalink pages because they are the same page: the kind only
// changes one badge and where the tags point. Duplicating ~50 lines of header
// per kind is how the two would drift into looking like different products.
//
// Function props are fine here and ONLY here: this component is rendered by a
// server component into server HTML, so `tagHref` never crosses the
// server→client boundary. The client island next to it takes strings.
import { PlayCircle } from "lucide-react";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import { TagRow } from "./tag-row";
import type { MateriKind, PublicMateri } from "../types";

export type MateriPageHeaderProps = {
  materi: PublicMateri;
  /** Which route this is — picks the eyebrow. Not read off `materi.kind`: the
   *  page has already redirected a mismatch, so by here they agree. */
  kind: MateriKind;
  /** Absolute URL, for the share sheet. */
  shareUrl: string;
  /** Where a tag goes back to. Server→server, so a builder is safe. */
  tagHref: (tag: string) => string;
  copy?: MateriCopyOverride;
};

export function MateriPageHeader({
  materi,
  kind,
  shareUrl,
  tagHref,
  copy: copyOverride,
}: MateriPageHeaderProps) {
  const copy = mergeMateriCopy(copyOverride);
  const createdAt = new Date(materi.createdAt);

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="eyebrow border px-2 py-0.5">
          {kind === "skill" ? copy.skillBadge : copy.libraryTitle}
        </span>
        {materi.hasVideo ? (
          <span className="inline-flex items-center gap-1 border border-accent/50 bg-accent/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-accent">
            <PlayCircle className="size-3" aria-hidden />
            {copy.videoBadge}
          </span>
        ) : null}
        <time dateTime={createdAt.toISOString()} className="text-muted-foreground">
          {createdAt.toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>

      {/* The ONE h1 of this page, in server HTML. The island is told not to
          render a second one (`hasServerHeading`). */}
      <h1 className="title-content text-balance text-2xl [overflow-wrap:anywhere] @sm:text-3xl">
        {materi.title}
      </h1>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3">
        {/* Server-rendered tag links: indexable, and they work with JS off.
            The island renders the live tag row again under the body, where a
            reader who just finished reading wants it. */}
        <TagRow tags={materi.tags} tagHref={tagHref} copy={copyOverride} />
        <TombolBagikan url={shareUrl} title={materi.title} variant="ghost" />
      </div>
    </header>
  );
}
