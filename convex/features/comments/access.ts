// comments feature — access helpers. Every public function's handler calls
// one of these before touching data (P0 server-side authz; route guards are
// UX). Protected helpers authenticate (requireUser) BEFORE any by-ID read, so
// anonymous callers are rejected before a domain row is touched — no existence
// oracle (pattern: convex/features/courses/access.ts).
//
// tenantId is ALWAYS taken from the LESSON (or comment) row, never from args
// (assignment #16 P0).
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Lesson by id or NOT_FOUND. */
export async function getLessonOrFail(ctx: Ctx, lessonId: Id<"lessons">): Promise<Doc<"lessons">> {
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Lesson tidak ditemukan");
  return lesson;
}

/**
 * Discussion access: auth FIRST, then resolve the lesson and require member+
 * on the lesson's OWN tenantId. Honors the DATA-MODEL access table ("comments:
 * member tenant — lesson yang bisa ia akses"): lessons of NON-published
 * courses stay instructor+ only, mirroring the courses read rules.
 * TODO(rr): confirm — archived courses gated like drafts (instructor+ only),
 * matching the courses etalase "published-only" reading of the access table.
 */
export async function requireMemberForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; membership: Doc<"memberships">; lesson: Doc<"lessons"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const lesson = await getLessonOrFail(ctx, lessonId);
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  if (membership.role === "member") {
    const course = await ctx.db.get(lesson.courseId);
    if (course === null || course.status !== "published") {
      fail("NOT_AUTHORIZED", "Kamu tidak punya akses untuk aksi ini");
    }
  }
  return { userId, membership, lesson };
}

/**
 * Soft-delete authz (DATA-MODEL: "soft-delete: author atau instructor+").
 * Auth FIRST, then resolve the comment; the author may always delete their own
 * comment, anyone else must be instructor+ on the comment's OWN tenantId.
 */
export async function requireAuthorOrInstructorForComment(
  ctx: Ctx,
  commentId: Id<"comments">
): Promise<{ userId: Id<"users">; comment: Doc<"comments"> }> {
  const userId = await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const comment = await ctx.db.get(commentId);
  if (comment === null) fail("NOT_FOUND", "Komentar tidak ditemukan");
  if (comment.userId !== userId) {
    await requireTenantRole(ctx, comment.tenantId, "instructor");
  }
  return { userId, comment };
}

/**
 * Depth-1 invariant (assignment #16): a reply's parent must (1) exist, (2)
 * belong to the SAME lesson (which also pins the same tenant), (3) be a ROOT
 * comment, and (4) not be soft-deleted. Anything else → VALIDATION_FAILED.
 * TODO(rr): confirm — replying to a soft-deleted root rejected (the UI hides
 * "Balas" on placeholders; a crafted client gets VALIDATION_FAILED).
 */
export async function assertRootParentOnLesson(
  ctx: Ctx,
  parentId: Id<"comments">,
  lessonId: Id<"lessons">
): Promise<void> {
  const parent = await ctx.db.get(parentId);
  if (parent === null || parent.lessonId !== lessonId) {
    fail("VALIDATION_FAILED", "Komentar induk tidak valid untuk lesson ini");
  }
  if (parent.parentId !== undefined) {
    fail("VALIDATION_FAILED", "Balasan hanya bisa ke komentar utama (maksimal 1 tingkat)");
  }
  if (parent.deletedAt !== undefined) {
    fail("VALIDATION_FAILED", "Komentar induk sudah dihapus");
  }
}
