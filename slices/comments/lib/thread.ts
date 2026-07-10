// comments slice — pure thread builder. The query returns a FLAT list (newest
// first, bounded take); this nests depth-1 replies under their roots
// client-side (assignment #16). Adapted from the rr `comments` buildThread
// idea (orphan-safe tree) simplified to our fixed depth-1 model.
import type { CommentItem } from "../types";

export type CommentThread = {
  root: CommentItem;
  /** Oldest-first — a conversation reads top-down under its root. */
  replies: CommentItem[];
};

/**
 * Group a flat item list into threads:
 * - roots ordered newest-first (the server already returns desc; re-sorted
 *   here so the result is stable regardless of input order);
 * - replies nested under their root, oldest-first;
 * - ORPHAN replies (root trimmed by the bounded take) are promoted to roots
 *   instead of being dropped — nothing the server sent disappears.
 */
export function buildThread(items: CommentItem[]): CommentThread[] {
  const rootIds = new Set(items.filter((i) => i.parentId === null).map((i) => i._id));
  const replies = new Map<string, CommentItem[]>();
  const roots: CommentItem[] = [];

  for (const item of items) {
    if (item.parentId !== null && rootIds.has(item.parentId)) {
      const bucket = replies.get(item.parentId) ?? [];
      bucket.push(item);
      replies.set(item.parentId, bucket);
    } else {
      roots.push(item); // true root, or orphan promoted to root
    }
  }

  roots.sort((a, b) => b.createdAt - a.createdAt);
  return roots.map((root) => ({
    root,
    replies: (replies.get(root._id) ?? []).sort((a, b) => a.createdAt - b.createdAt),
  }));
}
