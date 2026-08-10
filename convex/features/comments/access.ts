// comments feature — access helpers. Every public function's handler calls
// one of these before touching data (P0 server-side authz; route guards are
// UX). Protected helpers authenticate (requireUser) BEFORE any by-ID read, so
// anonymous callers are rejected before a domain row is touched — no existence
// oracle (pattern: convex/features/courses/access.ts).
//
// tenantId is ALWAYS taken from the LESSON / POST (or comment) row, never from
// args (assignment #16 P0).
//
// v1.8 (#29): a comment hangs off EITHER a lesson OR a post. The schema cannot
// express that XOR, so it is enforced here — both set or neither set is
// VALIDATION_FAILED — and each branch resolves its own tenant + role gate.
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
 * Discussion access: auth FIRST, then resolve the MATERI and require member+
 * on the materi's OWN tenantId. Honors the DATA-MODEL access table ("comments:
 * member tenant — lesson yang bisa ia akses").
 *
 * MATERI MODEL (DECISIONS #36/#37): the visibility gate is the materi's own
 * `status` — published (or absent: legacy rows predate the column) for a
 * member, drafts additionally for instructor+. It used to resolve the owning
 * COURSE through `lesson.courseId` and gate on that; a materi is tenant-level
 * content now and may sit in several courses or none, so a course's draft
 * status no longer decides who may discuss the page.
 */
export async function requireMemberForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; membership: Doc<"memberships">; lesson: Doc<"lessons"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const lesson = await getLessonOrFail(ctx, lessonId);
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  if (membership.role === "member" && (lesson.status ?? "published") !== "published") {
    fail("NOT_AUTHORIZED", "Kamu tidak punya akses untuk aksi ini");
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

/** Post by id or NOT_FOUND. */
export async function getPostOrFail(ctx: Ctx, postId: Id<"posts">): Promise<Doc<"posts">> {
  const post = await ctx.db.get(postId);
  if (post === null) fail("NOT_FOUND", "Post tidak ditemukan");
  return post;
}

/**
 * Post-comment access (v1.8 #29): auth FIRST, then resolve the post and require
 * member+ on the POST's OWN tenantId. A soft-deleted post accepts no new
 * comments and is not readable — same treatment as a missing row.
 * Unlike the lesson branch there is no draft/published gate: a post IS the
 * published surface (its feed is anonymously readable, AGENTS.md §6).
 */
export async function requireMemberForPost(
  ctx: Ctx,
  postId: Id<"posts">
): Promise<{ userId: Id<"users">; membership: Doc<"memberships">; post: Doc<"posts"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const post = await getPostOrFail(ctx, postId);
  if (post.deletedAt !== undefined) fail("NOT_FOUND", "Post tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, post.tenantId, "member");
  return { userId, membership, post };
}

/** Discriminated comment target — the narrowed result of the XOR guard. */
export type CommentTarget =
  | { kind: "lesson"; lessonId: Id<"lessons"> }
  | { kind: "post"; postId: Id<"posts"> };

/**
 * XOR target guard (v1.8 #29, DATA-MODEL invariant "comments XOR target"):
 * exactly one of lessonId / postId must be set — both or neither is
 * VALIDATION_FAILED. Call AFTER requireUser so an anonymous caller can never
 * probe argument shapes. Returns the narrowed target so callers never need a
 * non-null assertion.
 */
export function assertExactlyOneTarget(args: {
  lessonId?: Id<"lessons">;
  postId?: Id<"posts">;
}): CommentTarget {
  if (args.lessonId !== undefined && args.postId === undefined) {
    return { kind: "lesson", lessonId: args.lessonId };
  }
  if (args.postId !== undefined && args.lessonId === undefined) {
    return { kind: "post", postId: args.postId };
  }
  return fail("VALIDATION_FAILED", "Komentar harus menempel pada satu lesson atau satu post");
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
  assertRootAndLive(parent);
}

/** Same depth-1 invariant for the POST branch (v1.8 #29). */
export async function assertRootParentOnPost(
  ctx: Ctx,
  parentId: Id<"comments">,
  postId: Id<"posts">
): Promise<void> {
  const parent = await ctx.db.get(parentId);
  if (parent === null || parent.postId !== postId) {
    fail("VALIDATION_FAILED", "Komentar induk tidak valid untuk post ini");
  }
  assertRootAndLive(parent);
}

/** Depth-1 + not-deleted checks shared by both parent guards. */
function assertRootAndLive(parent: Doc<"comments">): void {
  if (parent.parentId !== undefined) {
    fail("VALIDATION_FAILED", "Balasan hanya bisa ke komentar utama (maksimal 1 tingkat)");
  }
  if (parent.deletedAt !== undefined) {
    fail("VALIDATION_FAILED", "Komentar induk sudah dihapus");
  }
}
