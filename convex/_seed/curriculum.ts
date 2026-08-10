// Seeding a KELAS in the post-module shape (DECISIONS #37): a course is an
// ordered list of MATERI, not a tree. `modules` is gone, so a curriculum is a
// flat lesson array plus the quizzes that hang off the course.
//
// IDEMPOTENCE IS THE POINT OF THIS FILE. Production is already seeded by the
// module-tree version of these seeds, and convex/seed.ts promises "re-running
// keeps existing rows", so every write here is gated on a probe of the
// DESTINATION rather than on a "course exists → skip the lot" shortcut:
//
//   · materi  → `lessons.by_tenant_slug`, walking the same candidate ladder
//               (`slug`, `slug-2`, …) that `courses/slug.uniqueSlug` and the
//               one-shot materiBackfill used, so a title-derived slug FINDS the
//               live row the backfill minted instead of duplicating it;
//   · placement → `courseLessons.by_course_lesson`;
//   · kuis    → `quizzes.by_course` + title.
//
// A second run therefore inserts zero rows and renumbers nothing.
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { baseSlug } from "../features/courses/slug";
import { MAX_LESSONS_PER_COURSE } from "../features/courses/validate";

export type SeedMateri = {
  title: string;
  contentMd: string;
  links?: { label: string; url: string }[];
  youtubeVideoId?: string;
};
export type SeedCourseQuiz = {
  title: string;
  passingScorePct: number;
  questions: { prompt: string; options: string[]; correctIndex: number; explanation?: string }[];
};
/** One kelas: metadata + its materi in reading order + its course-level quizzes. */
export type SeedCurriculum = {
  slug: string;
  title: string;
  description: string;
  lessons: SeedMateri[];
  quizzes: SeedCourseQuiz[];
};

export type CurriculumResult = {
  courseSlug: string;
  course: 0 | 1;
  lessons: number;
  placements: number;
  quizzes: number;
};

/** Same bound as `uniqueSlug` — a title colliding 50 times is not real. */
const MAX_SLUG_TRIES = 50;
/** Bounded read instead of a bare `.collect()`; no course seeds near this. */
const MAX_QUIZZES_PER_COURSE = 50;

/**
 * The materi with this title in this tenant, or null. Walks `slug`, `slug-2`, …
 * exactly like `uniqueSlug` mints them and stops at the first FREE candidate:
 * past that point the ladder cannot hold our row, because whoever created it
 * would have taken that free rung first.
 *
 * `claimed` holds the materi this pass has already matched. Without it a
 * curriculum listing the same TITLE twice — two "Ringkasan", say — would match
 * both entries to the same row and silently drop the second: no insert, no
 * placement, no error. The `-2` rung `uniqueSlug` would have minted for it is
 * unreachable if the walk returns on the first title match. Skipping a claimed
 * row keeps climbing, so the second entry resolves to `ringkasan-2`.
 */
async function findMateriByTitle(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  title: string,
  claimed: Set<Id<"lessons">>
): Promise<{ id: Id<"lessons"> | null; slug: string }> {
  const base = baseSlug(title);
  for (let n = 1; n <= MAX_SLUG_TRIES; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const row = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", slug))
      .first();
    if (row === null) return { id: null, slug };
    if (row.title === title && !claimed.has(row._id)) return { id: row._id, slug };
  }
  return { id: null, slug: `${base}-${Date.now()}` };
}

/** Upsert one kelas: course row, its materi, their placements, its quizzes. */
export async function upsertCurriculum(
  ctx: MutationCtx,
  opts: { tenantId: Id<"tenants">; createdBy: Id<"users">; curriculum: SeedCurriculum }
): Promise<CurriculumResult> {
  const { tenantId, createdBy, curriculum } = opts;
  const made: CurriculumResult = {
    courseSlug: curriculum.slug,
    course: 0,
    lessons: 0,
    placements: 0,
    quizzes: 0,
  };

  const existingCourse = await ctx.db
    .query("courses")
    .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", curriculum.slug))
    .unique();
  const courseId =
    existingCourse?._id ??
    (await ctx.db.insert("courses", {
      tenantId,
      slug: curriculum.slug,
      title: curriculum.title,
      description: curriculum.description,
      status: "published",
      createdBy,
    }));
  if (existingCourse === null) made.course = 1;

  // Placement order comes from what the course ALREADY holds, never from the
  // curriculum array index.
  //
  // The 76 live placements were written 0-based by materiBackfill. Numbering a
  // new one from the array index instead would hand it a 1-based position that
  // collides with a live row the moment a curriculum grows: insert "BARU"
  // second into A@0,B@1,C@2 and you get BARU@2 alongside C@2 — a duplicate
  // order, and BARU reading after B instead of before it. Appending past the
  // high-water mark cannot collide, and it also refuses to overwrite an order
  // an instructor set by hand in Kelola.
  //
  // ponytail: appended, not inserted at the curriculum's position. A materi
  // added to the middle of a seed array lands at the END of an already-seeded
  // course; reorder it in Kelola. Renumbering the whole course to match the
  // array would fix the position and clobber every manual reorder — a worse
  // trade for a bootstrap script. On a fresh database there is nothing to
  // append to, so seeds still produce exactly the array's order, 1..n.
  //
  // 1-based on a fresh course because that is what `manage.reorderCourseLessons`
  // writes, and it is the only ordering path a human drives. The value itself is
  // relative — `by_course` ranges over it and nothing reads it as a cardinal —
  // so the 0-based rows the backfill left in production are not wrong, just a
  // different origin, and appending past the high-water mark keeps any single
  // course internally consistent regardless of which origin it started from.
  const existing = await ctx.db
    .query("courseLessons")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_LESSONS_PER_COURSE);
  const placedLessonIds = new Set(existing.map((row) => row.lessonId));
  let nextOrder = existing.reduce((high, row) => Math.max(high, row.order + 1), 1);

  const claimed = new Set<Id<"lessons">>();
  for (const materi of curriculum.lessons) {
    const found = await findMateriByTitle(ctx, tenantId, materi.title, claimed);
    let lessonId = found.id;
    if (lessonId === null) {
      lessonId = await ctx.db.insert("lessons", {
        tenantId,
        title: materi.title,
        slug: found.slug,
        status: "published",
        authorId: createdBy,
        contentMd: materi.contentMd,
        links: materi.links ?? [],
        ...(materi.youtubeVideoId === undefined
          ? {}
          : { youtubeVideoId: materi.youtubeVideoId }),
      });
      made.lessons++;
    }
    claimed.add(lessonId);

    if (!placedLessonIds.has(lessonId)) {
      await ctx.db.insert("courseLessons", { tenantId, courseId, lessonId, order: nextOrder });
      placedLessonIds.add(lessonId);
      nextOrder++;
      made.placements++;
    }
  }

  const liveQuizzes = await ctx.db
    .query("quizzes")
    .withIndex("by_course", (q) => q.eq("courseId", courseId))
    .take(MAX_QUIZZES_PER_COURSE);
  const quizTitles = new Set(liveQuizzes.map((row) => row.title));
  for (const quiz of curriculum.quizzes) {
    if (quizTitles.has(quiz.title)) continue;
    await ctx.db.insert("quizzes", {
      tenantId,
      courseId,
      title: quiz.title,
      passingScorePct: quiz.passingScorePct,
      questions: quiz.questions,
    });
    made.quizzes++;
  }

  return made;
}

/** Owner + tenant lookup shared by the standalone curriculum seeds. */
export async function resolveSeedTarget(
  ctx: MutationCtx,
  args: { ownerEmail: string; tenantSlug: string }
): Promise<{ tenantId: Id<"tenants">; createdBy: Id<"users"> }> {
  const user = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", args.ownerEmail))
    .unique();
  if (user === null) throw new Error(`No user ${args.ownerEmail} — login + bootstrap first.`);
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
    .unique();
  if (tenant === null) throw new Error(`No tenant ${args.tenantSlug} — run seed:bootstrap first.`);
  return { tenantId: tenant._id, createdBy: user._id };
}
