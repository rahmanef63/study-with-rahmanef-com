// comments feature — explicit safe projections for every read (P0: queries
// return an explicit shape, never raw docs).
//
// Soft-deleted comments become a PLACEHOLDER: `deleted: true`, bodyMd/author
// null — the original body NEVER leaves the server after deletion (asserted in
// queries.test.ts). `userId` is never exposed on any shape; the author is
// joined to public-profile fields only (displayName + username), and `mine`
// tells the viewer which comments are theirs.
import type { Doc, Id } from "../../_generated/dataModel";

/** Public-profile author join (null when the author has no profile row). */
export type CommentAuthor = { displayName: string; username: string } | null;

/** Soft-deleted placeholder — keeps its slot in the thread, leaks nothing. */
export function toDeletedPlaceholder(c: Doc<"comments">) {
  return {
    _id: c._id,
    parentId: c.parentId ?? null,
    deleted: true as const,
    bodyMd: null,
    author: null,
    createdAt: c._creationTime,
    mine: false,
  };
}

/** Live comment item. */
export function toCommentItem(
  c: Doc<"comments">,
  author: CommentAuthor,
  viewerId: Id<"users">
) {
  if (c.deletedAt !== undefined) return toDeletedPlaceholder(c);
  return {
    _id: c._id,
    parentId: c.parentId ?? null,
    deleted: false as const,
    bodyMd: c.bodyMd,
    author,
    createdAt: c._creationTime,
    mine: c.userId === viewerId,
  };
}

export type CommentItem = ReturnType<typeof toCommentItem>;

/** listByLesson result — items flat (client nests via buildThread). */
export type LessonCommentsResult = {
  /** Viewer is instructor+ — may delete any comment. UX hint only (P0 re-checked server-side). */
  canModerate: boolean;
  items: CommentItem[];
};
