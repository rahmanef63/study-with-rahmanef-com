// buildThread specs — nesting, ordering, orphan safety (pure lib).
import { describe, expect, test } from "vitest";
import { buildThread } from "../lib/thread";
import type { CommentItem } from "../types";

let n = 0;
function item(overrides: Partial<CommentItem> & { createdAt: number }): CommentItem {
  n += 1;
  return {
    _id: `c${n}` as CommentItem["_id"],
    parentId: null,
    deleted: false,
    bodyMd: `body ${n}`,
    author: { displayName: "Budi", username: "budi" },
    mine: false,
    ...overrides,
  } as CommentItem;
}

describe("buildThread", () => {
  test("roots newest-first; replies nested oldest-first", () => {
    const rootOld = item({ createdAt: 100 });
    const rootNew = item({ createdAt: 300 });
    const replyLate = item({ createdAt: 250, parentId: rootOld._id });
    const replyEarly = item({ createdAt: 150, parentId: rootOld._id });

    const threads = buildThread([rootNew, replyLate, replyEarly, rootOld]);
    expect(threads.map((t) => t.root._id)).toEqual([rootNew._id, rootOld._id]);
    expect(threads[1].replies.map((r) => r._id)).toEqual([replyEarly._id, replyLate._id]);
    expect(threads[0].replies).toEqual([]);
  });

  test("orphan reply (root trimmed by the take bound) is promoted, not dropped", () => {
    const orphan = item({ createdAt: 200, parentId: "missing-root" as CommentItem["parentId"] });
    const root = item({ createdAt: 100 });
    const threads = buildThread([orphan, root]);
    expect(threads).toHaveLength(2);
    expect(threads[0].root._id).toBe(orphan._id); // newest-first still holds
  });

  test("deleted root keeps its slot so replies stay anchored", () => {
    const deletedRoot = item({ createdAt: 100, deleted: true, bodyMd: null, author: null } as Partial<CommentItem> & { createdAt: number });
    const reply = item({ createdAt: 150, parentId: deletedRoot._id });
    const threads = buildThread([deletedRoot, reply]);
    expect(threads).toHaveLength(1);
    expect(threads[0].root.deleted).toBe(true);
    expect(threads[0].replies.map((r) => r._id)).toEqual([reply._id]);
  });

  test("empty input → empty output", () => {
    expect(buildThread([])).toEqual([]);
  });
});
