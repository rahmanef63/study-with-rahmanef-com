// progress feature — authz helpers. Every public function's handler calls one
// of these FIRST (P0 server-side authz; route guards are UX only). Auth runs
// BEFORE any domain read so anonymous callers are rejected before a row is
// touched (no existence oracle) — mirrors convex/features/courses/access.ts.
//
// Cross-slice rule (docs/AGENT-PROMPTS.md epsilon): progress never imports the
// courses feature. It reads the shared `lessons`/`courses` tables (composed by
// the integrator from docs/DATA-MODEL.md) directly — that is table access, not
// a code import, and progress derivation over those tables is the DATA-MODEL's
// own design ("Derivasi & invarian").
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import { requireTenantRole, requireUser } from "../../_shared/auth";
import { fail } from "./errors";

type Ctx = QueryCtx | MutationCtx;

/** Lesson + membership(member) on the lesson's own tenant, or throw. */
export async function requireMemberForLesson(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<{ userId: Id<"users">; lesson: Doc<"lessons">; membership: Doc<"memberships"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const lesson = await ctx.db.get(lessonId);
  if (lesson === null) fail("NOT_FOUND", "Lesson tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, lesson.tenantId, "member");
  return { userId, lesson, membership };
}

/** Course + membership(member) on the course's own tenant, or throw. */
export async function requireMemberForCourse(
  ctx: Ctx,
  courseId: Id<"courses">
): Promise<{ userId: Id<"users">; course: Doc<"courses">; membership: Doc<"memberships"> }> {
  await requireUser(ctx); // auth BEFORE read (no existence oracle)
  const course = await ctx.db.get(courseId);
  if (course === null) fail("NOT_FOUND", "Kelas tidak ditemukan");
  const { userId, membership } = await requireTenantRole(ctx, course.tenantId, "member");
  return { userId, course, membership };
}

/**
 * Draft/archived courses are invisible to plain members IN THE QUERY, exactly
 * as courses.getLesson enforces (R4). Prevents a member from completing (and
 * earning a badge for) a course that is not published; instructor+ may act on
 * drafts for preview. Throws NOT_FOUND — never leaks existence to a member.
 */
export function assertCourseActableByRole(course: Doc<"courses">, role: Doc<"memberships">["role"]): void {
  if (course.status !== "published" && role === "member") {
    fail("NOT_FOUND", "Kelas tidak ditemukan");
  }
}
