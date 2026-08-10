// courses feature — access helpers + THE materi visibility rule.
// Every public function's handler calls one of these before touching data
// (P0 server-side authz; route guards are UX). Protected helpers authenticate
// (requireUser) BEFORE any DB read — the doc lookup only resolves the tenant
// for the role check, so anonymous callers are rejected before any domain row
// is touched (no existence oracle).
//
// ── MATERI VISIBILITY (migration contract, DECISIONS #36/#37) ───────────────
// A lesson is a MATERI owned by the tenant, not by a course. One rule, used by
// every read in this feature:
//   · a materi is visible to a MEMBER of its tenant when status is "published"
//     — `status === undefined` COUNTS AS PUBLISHED (the 76 production rows
//     predate the column and were live by definition);
//   · instructor+ additionally sees drafts;
//   · a COURSE's draft status gates the COURSE PAGE only, NEVER the materi —
//     materi is tenant-level content now, which is the whole point of the model;
//   · anonymous callers see the course etalase (titles/syllabus) and never
//     materi CONTENT. Unchanged.
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser, type TenantRole } from "../../_shared/auth";
import { fail } from "./errors";
import {
  MAX_LESSONS_PER_COURSE,
  MAX_PLACEMENTS_PER_MATERI,
  MAX_REF_ROWS_PER_MATERI,
  MAX_TAG_ROWS_PER_MATERI,
} from "./validate";

type Ctx = QueryCtx | MutationCtx;

/**
 * Non-throwing role probe for PUBLIC etalase queries (course title/syllabus
 * are public per docs/DATA-MODEL.md access table) that must still hide drafts
 * from everyone below instructor. Returns null for anonymous callers and
 * non-members.
 * TODO(rr): confirm — local duplicate of _shared membership lookup because
 * convex/_shared/** is integrator-only and only ships throwing helpers;
 * propose promoting a shared `getViewerRole` post-v1.
 */
export async function getViewerRole(
  ctx: Ctx,
  tenantId: Id<"tenants">
): Promise<TenantRole | null> {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return null;
  const membership = await ctx.db
    .query("memberships")
    .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", userId))
    .unique();
  return membership?.role ?? null;
}

export function isInstructorPlus(role: TenantRole | null): boolean {
  return role === "instructor" || role === "owner";
}

/** A row with no `status` predates the column and was, by definition, live. */
export function isPublishedMateri(lesson: Doc<"lessons">): boolean {
  return (lesson.status ?? "published") === "published";
}

/** The visibility rule above, as one call. `role` is the viewer's role IN THE
 *  MATERI'S OWN TENANT — never a role resolved from the course. */
export function canSeeMateri(lesson: Doc<"lessons">, role: TenantRole | null): boolean {
  return isPublishedMateri(lesson) || isInstructorPlus(role);
}

/** Course by id or NOT_FOUND. */
export async function getCourseOrFail(ctx: Ctx, courseId: Id<"courses">): Promise<Doc<"courses">> {
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  return course;
}

/** Materi by id or NOT_FOUND. */
export async function getLessonOrFail(ctx: Ctx, lessonId: Id<"lessons">): Promise<Doc<"lessons">> {
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Materi tidak ditemukan");
  return lesson;
}

/**
 * Authz for course-scoped writes: resolve doc → requireTenantRole(instructor)
 * on the doc's own tenantId (every domain table carries tenantId).
 */
export async function requireInstructorForCourse(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; course: Doc<"courses"> }> {
  await requireUser(ctx); // auth BEFORE read (review fix #2)
  const course = await getCourseOrFail(ctx, courseId);
  const { userId } = await requireTenantRole(ctx, course.tenantId, "instructor");
  return { userId, course };
}

export async function requireInstructorForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons"> }> {
  await requireUser(ctx); // auth BEFORE read (review fix #2)
  const lesson = await getLessonOrFail(ctx, lessonId);
  const { userId } = await requireTenantRole(ctx, lesson.tenantId, "instructor");
  return { userId, lesson };
}

/** Placements of a course, already ordered — `by_course` is ["courseId","order"],
 *  so the index range IS the syllabus order. Bounded by the by-design cap. */
export async function listPlacements(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<Array<Doc<"courseLessons">>> {
  return ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSONS_PER_COURSE);
}

/**
 * Delete every join row that exists only to point AT this materi — its
 * placements, its tags and its references in both directions. Called by
 * `lessons.deleteLesson` after its completion guard passes; nothing else here
 * deletes, so the caller keeps ownership of the materi row itself.
 */
export async function deleteMateriJoinRows(
  ctx: MutationCtx,
  lessonId: Id<"lessons">
): Promise<void> {
  const rows = [
    ...(await ctx.db
      .query("courseLessons")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .take(MAX_PLACEMENTS_PER_MATERI)),
    ...(await ctx.db
      .query("lessonTags")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .take(MAX_TAG_ROWS_PER_MATERI)),
    ...(await ctx.db
      .query("lessonRefs")
      .withIndex("by_from", (q) => q.eq("fromLessonId", lessonId))
      .take(MAX_REF_ROWS_PER_MATERI)),
    ...(await ctx.db
      .query("lessonRefs")
      .withIndex("by_to", (q) => q.eq("toLessonId", lessonId))
      .take(MAX_REF_ROWS_PER_MATERI)),
  ];
  for (const row of rows) await ctx.db.delete(row._id);
}

/** The one placement row for (course, materi), or null. */
export async function getPlacement(
  ctx: Ctx,
  courseId: Id<"courses">,
  lessonId: Id<"lessons">
): Promise<Doc<"courseLessons"> | null> {
  return ctx.db
    .query("courseLessons")
    .withIndex("by_course_lesson", (q) => q.eq("courseId", courseId).eq("lessonId", lessonId))
    .unique();
}
