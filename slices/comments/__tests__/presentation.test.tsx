// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";
import type { Id } from "@convex/_generated/dataModel";
import { LessonComments } from "../views/lesson-comments";
import { CommentItem } from "../components/comment-item";
import { CommentThread } from "../components/comment-thread";
import { CommentForm } from "../components/comment-form";
import { COMMENTS_COPY } from "../config/copy";
import type { CommentItem as Item, LessonCommentsResult } from "../types";

const reads = vi.hoisted(() => ({ data: undefined as LessonCommentsResult | undefined }));
vi.mock("../hooks/use-lesson-comments", () => ({ useLessonComments: () => reads.data, usePostComments: () => reads.data }));
vi.mock("../hooks/use-comment-mutations", () => ({
  useAddComment: () => ({ add: vi.fn(), isPending: false }),
  useDeleteComment: () => ({ softDelete: vi.fn(), isPending: false }),
}));
vi.mock("../components/delete-comment-dialog", () => ({ DeleteCommentDialog: () => null }));

const id = "lesson" as Id<"lessons">;
const item: Item = { _id: "comment" as Id<"comments">, parentId: null, deleted: false,
  bodyMd: "x".repeat(2000), author: { displayName: "a".repeat(200), username: "member" },
  createdAt: 1, mine: true };

beforeEach(() => { reads.data = { canModerate: false, items: [item] }; });

test("the comment session resets all local state when either target changes", () => {
  const first = LessonComments({ lessonId: id });
  const same = LessonComments({ lessonId: id });
  const next = LessonComments({ lessonId: "next" as Id<"lessons"> });
  const post = LessonComments({ postId: "lesson" as Id<"posts"> });
  expect(first.key).toBe(same.key);
  expect(first.key).not.toBe(next.key);
  expect(first.key).not.toBe(post.key);
});

test("long threads are named keyboard scroll regions while the composer stays outside", () => {
  reads.data!.items = Array.from({ length: 80 }, (_, index) => ({ ...item, _id: `c${index}` as Id<"comments"> }));
  const html = renderToStaticMarkup(<LessonComments lessonId={id} />);
  const region = html.slice(html.indexOf('role="region"'));
  expect(region).toContain('aria-label="Komentar dan balasan"');
  expect(region).toContain('tabindex="0"');
  expect(region).toContain("max-h-[min(32rem,60dvh)]");
  expect(region).toContain("overflow-y-auto overscroll-contain");
  expect(region).not.toContain("<form");
  expect(html.indexOf("<form")).toBeLessThan(html.indexOf('role="region"'));
  expect(region.match(/<li\b/g)).toHaveLength(80);
});

test("loading and empty states retain region context without a redundant keyboard stop", () => {
  for (const data of [undefined, { canModerate: false, items: [] }]) {
    reads.data = data;
    const html = renderToStaticMarkup(<LessonComments lessonId={id} />);
    expect(html).toContain('aria-label="Komentar dan balasan"');
    expect(html).not.toContain('tabindex="0"');
    expect(html).toContain(`aria-busy="${data === undefined}"`);
  }
});

test("post threads use post copy and retain consumer overrides", () => {
  reads.data!.items = [];
  const postId = "post" as Id<"posts">;
  const html = renderToStaticMarkup(<LessonComments postId={postId} />);
  expect(html).toContain("catatanmu di post ini");
  expect(html).toContain("Belum ada balasan di post ini");
  expect(html).not.toContain("materi ini");
  const custom = renderToStaticMarkup(<LessonComments postId={postId}
    copy={{ sectionSubtitle: "Catatan bersama", emptyTitle: "Mulai percakapan" }} />);
  expect(custom).toContain("Catatan bersama");
  expect(custom).toContain("Mulai percakapan");
});

test("comment and author text wrap safely and never render user HTML", () => {
  const html = renderToStaticMarkup(<CommentItem item={{ ...item, bodyMd: "<script>bad</script>" }}
    canDelete onDelete={() => {}} copy={COMMENTS_COPY} />);
  expect(html).toContain("[overflow-wrap:anywhere]");
  expect(html).toContain("&lt;script&gt;bad&lt;/script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("min-h-11");
});

test("reply and delete controls remain reachable on narrow touch screens", () => {
  const html = renderToStaticMarkup(<CommentThread thread={{ root: item, replies: [] }}
    canModerate={false} onReply={async () => true} replying={false}
    onRequestDelete={() => {}} copy={COMMENTS_COPY} />);
  expect(html).toContain('aria-expanded="false"');
  expect(html.match(/min-h-11/g)).toHaveLength(2);
  expect(html).not.toContain("h-7");
});

test("busy composers preserve their text by disabling edit, cancel and repeated submission", () => {
  const html = renderToStaticMarkup(<CommentForm onSubmit={async () => false} submitting
    copy={COMMENTS_COPY} compact onCancel={() => {}} />);
  expect(html).toMatch(/<textarea[^>]*disabled=""/);
  expect(html).toMatch(/<button[^>]*type="button"[^>]*disabled=""/);
  expect(html).toMatch(/<button[^>]*type="submit"[^>]*aria-busy="true"[^>]*disabled=""/);
  expect(html.match(/min-h-11/g)).toHaveLength(2);
});
