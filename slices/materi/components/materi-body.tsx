// materi slice — the materi body: video, prose, links.
//
// NOT a second markdown renderer. It delegates to MarkdownView from
// @/features/courses, the app's single safe-subset renderer (15 block types,
// KaTeX/mermaid/recharts lazily imported). Two markdown parsers in one repo is
// exactly the drift that bites later, and the in-course reader
// (LessonPlayerView) renders the SAME materi through the SAME component — a
// materi must not look different depending on which URL you opened it from.
//
// `contentBlocks` is deliberately ignored: it is the block-editor's write
// format (DECISIONS #38) and `contentMd` stays the read surface.
import { LessonLinks, MarkdownView, YoutubeEmbed } from "@/features/courses";
import { mergeMateriCopy, type MateriCopyOverride } from "../config/copy";
import type { MateriLink } from "../types";

export type MateriBodyProps = {
  title: string;
  contentMd: string;
  youtubeVideoId?: string;
  links: MateriLink[];
  copy?: MateriCopyOverride;
  className?: string;
};

export function MateriBody({
  title,
  contentMd,
  youtubeVideoId,
  links,
  copy: copyOverride,
  className,
}: MateriBodyProps) {
  const copy = mergeMateriCopy(copyOverride);
  return (
    <div className={"space-y-6" + (className ? ` ${className}` : "")}>
      {youtubeVideoId ? <YoutubeEmbed videoId={youtubeVideoId} title={title} /> : null}
      {/* `reading` is the long-form type layer (globals.css): 17/18px, 1.75
          leading and a 68ch measure. NOT applied to a discussion post, where
          14px in a narrow column is right — this is the surface people read
          for ten minutes. */}
      <MarkdownView content={contentMd} className="reading" />
      <LessonLinks links={links} heading={copy.linksHeading} />
    </div>
  );
}
