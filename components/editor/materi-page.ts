// The lesson ⇄ Page mapping — the DATA half of the editor seam, kept pure so
// it can be unit-tested without React, Convex or the DOM.
//
// The block editor talks in `Page` (a notion document: id, title, blocks,
// icon, cover, parentId, favorite/trashed flags…). This app stores a MATERI:
// a `lessons` row with `title`, `contentMd` and `contentBlocks`. Everything the
// Page shape carries beyond those three is SESSION-ONLY — there is no column
// for it, so it is defaulted here and never sent back. That is deliberate and
// is why the editor mounts with `showHeader={false} showSubpages={false}`:
// controls that cannot persist are not shown.

import { markdownToBlocks } from "@notion/shared/lib/markdown";
import type { Block, Page } from "@notion/shared/types";

/** The subset of a materi the editor reads. Structurally what
 *  `courses.manage.getLessonForManage` returns. */
export interface MateriDoc {
  _id: string;
  title: string;
  contentMd: string;
  contentBlocks?: string;
}

/**
 * Blocks for a materi.
 *
 * `contentBlocks` is canonical WHEN PRESENT — the same rule the server writes
 * by. When it is absent (every one of the 76 rows that predate the editor) the
 * existing markdown is IMPORTED through the slice's own `markdownToBlocks`, so
 * a legacy materi opens as a real block document rather than one dead
 * paragraph. The import is not persisted on open; it becomes canonical on the
 * author's first save, which is also the first moment `contentMd` is
 * re-derived — so the round trip is observable before it is durable.
 *
 * A `contentBlocks` string that will not parse falls back to the markdown too:
 * the markdown is always a valid, if lossier, copy of the same document, and
 * an unparseable blob must not present as an empty page the author would then
 * save over.
 */
export function blocksForMateri(materi: MateriDoc): Block[] {
  if (materi.contentBlocks !== undefined && materi.contentBlocks !== "") {
    try {
      const parsed: unknown = JSON.parse(materi.contentBlocks);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed as Block[];
    } catch {
      // fall through to the markdown import
    }
  }
  const imported = markdownToBlocks(materi.contentMd);
  return imported.length > 0 ? imported : [emptyParagraph()];
}

/** A brand-new document still needs one focusable block. */
export function emptyParagraph(): Block {
  return { id: "blok-awal", type: "paragraph", text: "" };
}

/** Wrap a materi as the single Page the editor session knows about. */
export function materiToPage(materi: MateriDoc, blocks: Block[]): Page {
  return {
    id: materi._id,
    parentId: null,
    title: materi.title,
    icon: "",
    blocks,
    // Session-only, no column: the editor never surfaces controls for these
    // (see showHeader/showSubpages at the mount site).
    favorite: false,
    trashed: false,
    createdAt: 0,
    updatedAt: 0,
  };
}
