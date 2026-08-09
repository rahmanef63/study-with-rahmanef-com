// posts feature — explicit safe projections (P0: queries return an explicit
// shape, never raw docs).
//
// toPublicPost is the ANONYMOUS etalase shape (AGENTS.md §6). What it must
// NEVER carry, and what queries.test.ts asserts key-by-key on the serialized
// payload: `authorId`/`userId`, `tenantId`, e-mail, `deletedAt`, or any id
// besides the post's own `_id` (the permalink needs that one). The author is
// joined down to PUBLIC-PROFILE fields only — the same three fields
// /u/<username> already publishes.
import type { Doc, Id } from "../../_generated/dataModel";

/** Public-profile author join (null when the author has no profile row). */
export type PostAuthor = {
  displayName: string;
  username: string;
  avatarUrl: string | null;
} | null;

/** Profile doc → public author fields, or null. */
export function toPostAuthor(profile: Doc<"profiles"> | null): PostAuthor {
  if (profile === null) return null;
  return {
    displayName: profile.displayName,
    username: profile.username,
    avatarUrl: profile.avatarUrl ?? null,
  };
}

/** ANONYMOUS feed/permalink card. Every key is listed explicitly — no spread. */
export function toPublicPost(p: Doc<"posts">, author: PostAuthor) {
  return {
    _id: p._id,
    kind: p.kind,
    title: p.title,
    bodyMd: p.bodyMd,
    linkUrl: p.linkUrl ?? null,
    youtubeVideoId: p.youtubeVideoId ?? null,
    pinned: p.pinned,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    createdAt: p._creationTime,
    author,
  };
}

/**
 * The caller's OWN post row (listMine). Adds lastActivityAt for "ada balasan
 * baru?" sorting; still no ids beyond the post's own and still no authorId —
 * the caller already knows they wrote it.
 */
export function toMinePost(p: Doc<"posts">) {
  return {
    _id: p._id,
    kind: p.kind,
    title: p.title,
    bodyMd: p.bodyMd,
    linkUrl: p.linkUrl ?? null,
    youtubeVideoId: p.youtubeVideoId ?? null,
    pinned: p.pinned,
    likeCount: p.likeCount,
    commentCount: p.commentCount,
    createdAt: p._creationTime,
    lastActivityAt: p.lastActivityAt,
  };
}

export type PublicPost = ReturnType<typeof toPublicPost>;
export type MinePost = ReturnType<typeof toMinePost>;

/** Cursor page of the anonymous feed (Convex pagination envelope, projected). */
export type PublicPostPage = {
  page: PublicPost[];
  isDone: boolean;
  continueCursor: string;
};

/** Author ids of a page, de-duplicated — bounds the profile join. */
export function distinctAuthorIds(rows: Doc<"posts">[]): Id<"users">[] {
  return [...new Set(rows.map((p) => p.authorId))];
}
