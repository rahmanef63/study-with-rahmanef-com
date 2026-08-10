// materi feature — the bounded DB loaders shared by the read surface.
// Nothing here authenticates: every caller has already run an access.ts helper.
// Every read is `.withIndex(...).take(bound)` — no bare .collect() (P0).
import type { Doc, Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type { TenantRole } from "../../_shared/auth";
import { canSeeMateri, isInstructorPlus, materiKind } from "./access";
import type { MateriCard, MateriCourseRef, MateriRef } from "./projections";
import { BACKLINK_TAKE, PLACEMENT_TAKE, promptPreview, TAG_ROW_TAKE } from "./validate";

type Ctx = QueryCtx | MutationCtx;

/**
 * The library row — shared by the paginated library and the skills search so
 * one card shape cannot drift into two. Two bounded index reads per card (tags
 * + placements), which is why every caller slices to its page size BEFORE
 * projecting. Member+ surface: the prompt preview lives here, never on the
 * anonymous etalase.
 */
export async function toCard(ctx: Ctx, lesson: Doc<"lessons">): Promise<MateriCard> {
  const placements = await loadPlacements(ctx, lesson._id);
  return {
    _id: lesson._id,
    slug: lesson.slug ?? null,
    title: lesson.title,
    kind: materiKind(lesson),
    promptPreview: promptPreview(lesson.promptText),
    tags: await loadTags(ctx, lesson._id),
    // Raw placement count: resolving each course to check its status would cost
    // one read per placement per row. The number never names a course.
    courseCount: placements.length,
    updatedAt: lesson._creationTime,
  };
}

/** Tag rows are per-lesson and capped; deduped + sorted for a stable UI. */
export async function loadTags(ctx: Ctx, lessonId: Id<"lessons">): Promise<string[]> {
  const rows = await ctx.db
    .query("lessonTags")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .take(TAG_ROW_TAKE);
  return [...new Set(rows.map((row) => row.tag))].sort();
}

/** Raw placements (courseLessons) for one materi, bounded. */
export async function loadPlacements(
  ctx: Ctx,
  lessonId: Id<"lessons">
): Promise<Doc<"courseLessons">[]> {
  return await ctx.db
    .query("courseLessons")
    .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
    .take(PLACEMENT_TAKE);
}

/**
 * "Muncul di kelas Claude Code dan Hermes." Contract clause 3: the course's own
 * status does not hide the materi, it only decides whether that course is NAMED
 * here — below instructor level, an unpublished course is omitted.
 */
export async function loadTeachingCourses(
  ctx: Ctx,
  lesson: Doc<"lessons">,
  role: TenantRole | null
): Promise<MateriCourseRef[]> {
  const placements = await loadPlacements(ctx, lesson._id);
  const seesUnpublished = isInstructorPlus(role);
  const out: MateriCourseRef[] = [];
  for (const placement of placements) {
    const course = await ctx.db.get(placement.courseId);
    if (course === null) continue;
    if (course.tenantId !== lesson.tenantId) continue; // cross-tenant row: ignore
    if (course.status !== "published" && !seesUnpublished) continue;
    out.push({
      _id: course._id,
      slug: course.slug,
      title: course.title,
      status: course.status,
      order: placement.order,
    });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}

/**
 * Materi pages that reference this one. Each source materi is re-checked
 * against the visibility contract, so a draft page never announces itself to a
 * member through someone else's backlink list.
 */
export async function loadBacklinkMateri(
  ctx: Ctx,
  lesson: Doc<"lessons">,
  role: TenantRole | null
): Promise<MateriRef[]> {
  if (role === null) return []; // anonymous never sees the reference graph
  const refs = await ctx.db
    .query("lessonRefs")
    .withIndex("by_to", (q) => q.eq("toLessonId", lesson._id))
    .take(BACKLINK_TAKE);
  const seen = new Set<string>();
  const out: MateriRef[] = [];
  for (const ref of refs) {
    if (seen.has(ref.fromLessonId)) continue;
    seen.add(ref.fromLessonId);
    const from = await ctx.db.get(ref.fromLessonId);
    if (from === null) continue;
    if (from.tenantId !== lesson.tenantId) continue;
    if (!canSeeMateri(from, role)) continue;
    out.push({ _id: from._id, slug: from.slug ?? null, title: from.title });
  }
  return out.sort((a, b) => a.title.localeCompare(b.title));
}
