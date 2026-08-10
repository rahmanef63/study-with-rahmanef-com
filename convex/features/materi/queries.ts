// materi feature — the standalone-materi read surface (DECISIONS #36/#37).
// A materi belongs to the TENANT: it has its own canonical, shareable URL
// /k/<tenant>/materi/<lessonSlug>, and reading it never goes through a course.
// The visibility contract it implements is written out in full in ./access.ts.
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6): publicGetBySlug and
// publicListSlugs — those two, nothing else.
// Conditions, in order: (1) the name starts with `public`; (2) the tenant is
// resolved through `tenants.by_slug` and must be ACTIVE, the materi through
// `lessons.by_tenant_slug`, and because that index carries no status column the
// PUBLISHED status is RE-CHECKED on the doc BEFORE anything is projected
// (the permalink carve-out), while the course list it returns is filtered to
// published courses; (3) it returns `PublicMateri`, an explicit projection with
// NO contentMd, NO contentBlocks, NO links, NO youtubeVideoId and no author.
import { v } from "convex/values";
import { query } from "../../_generated/server";
import { requireActiveTenantBySlug } from "../../_shared/auth";
import {
  canSeeMateri,
  isInstructorPlus,
  isPublishedMateri,
  materiKind,
  requireMemberForLesson,
  requireMemberForTenantSlug,
} from "./access";
import { fail } from "./errors";
import { loadBacklinkMateri, loadTags, loadTeachingCourses } from "./links";
import type { MateriBacklinks, MateriDetail, PublicMateri } from "./projections";
import { isLessonSlug, SITEMAP_TAKE } from "./validate";

/**
 * ANONYMOUS. The etalase of one materi: enough for a shared link to unfurl with
 * a real title and for a crawler to index the page, and nothing more. The body
 * stays member-gated — see `getBySlug`.
 *
 * `null` when the materi is unknown, unslugged or a draft (indistinguishable,
 * by design); NOT_FOUND only when the community itself is not active, exactly
 * like every other etalase read in this codebase.
 */
export const publicGetBySlug = query({
  args: { tenantSlug: v.string(), lessonSlug: v.string() },
  handler: async (ctx, args): Promise<PublicMateri | null> => {
    const tenant = await requireActiveTenantBySlug(ctx, args.tenantSlug);
    if (!isLessonSlug(args.lessonSlug)) return null; // junk never becomes a probe
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", tenant._id).eq("slug", args.lessonSlug)
      )
      .unique();
    // Status RE-CHECK before projecting: the index above ranges over slug, not
    // status, so this line is what keeps drafts off the anonymous surface.
    if (lesson === null || !isPublishedMateri(lesson)) return null;

    const tags = await loadTags(ctx, lesson._id);
    const courses = await loadTeachingCourses(ctx, lesson, null); // published only
    return {
      _id: lesson._id,
      slug: args.lessonSlug,
      title: lesson.title,
      // `kind` yes, `promptText` NEVER: a crawler may know the page is a skill,
      // but the prompt is the thing a member joined for, so handing it to an
      // anonymous caller gives the product away on a guessable URL.
      // queries.test.ts asserts the absence key by key.
      kind: materiKind(lesson),
      tags,
      hasVideo: lesson.youtubeVideoId !== undefined,
      courses: courses.map((course) => ({ slug: course.slug, title: course.title })),
      tenant: { slug: tenant.slug, name: tenant.name },
      createdAt: lesson._creationTime,
    };
  },
});

/**
 * ANONYMOUS. Slugs only, for `app/sitemap.ts`.
 *
 * The permalink is the whole reason the materi model was built — a shareable,
 * indexable address for one lesson. Without this the sitemap advertises tenants
 * and courses only, the library page is `robots: { index: false }` because it
 * lists member content, and a crawler has no path to any materi at all.
 *
 * Whitelist conditions: (1) `public` prefix; (2) tenant must be ACTIVE and the
 * ranges are `by_tenant_status`, so status is IN the index and no re-check is
 * needed; (3) the projection is a slug and a timestamp, strictly less than
 * `publicGetBySlug` already gives out per URL.
 *
 * TWO ranges, not one: the visibility contract counts a MISSING status as
 * published (pre-migration rows), and an index pinned to "published" cannot see
 * those. One range would quietly drop any legacy materi from the sitemap —
 * invisible, because the page itself would still render fine when visited.
 *
 * SKILLS ARE INCLUDED, and it takes no extra range: `kind` is just another
 * column, so a published skill already sits in `by_tenant_status`, and its
 * permalink is as shareable as any materi's. `kind` rides along so the sitemap
 * can route a skill to its own URL shape if the frontend grows one — a
 * category, not content, and the etalase already exposes it.
 */
export const publicListSlugs = query({
  args: { tenantId: v.id("tenants") },
  handler: async (
    ctx,
    args
  ): Promise<Array<{ slug: string; kind: "materi" | "skill"; updatedAt: number }>> => {
    const tenant = await ctx.db.get(args.tenantId);
    if (tenant === null || tenant.status !== "active") return [];
    const byStatus = async (status: "published" | undefined) =>
      ctx.db
        .query("lessons")
        .withIndex("by_tenant_status", (q) =>
          q.eq("tenantId", args.tenantId).eq("status", status)
        )
        .take(SITEMAP_TAKE);
    const lessons = [...(await byStatus("published")), ...(await byStatus(undefined))];
    return lessons
      .filter((lesson) => lesson.slug !== undefined)
      .map((lesson) => ({
        slug: lesson.slug as string,
        kind: materiKind(lesson),
        updatedAt: lesson._creationTime,
      }));
  },
});

/**
 * MEMBER+. The whole materi page: content, tags, the courses that teach it and
 * the materi that link to it. Authorization is on the MATERI'S tenant and the
 * MATERI'S status — no course is consulted, which is the point of the model.
 * A draft reads as NOT_FOUND below instructor level.
 */
export const getBySlug = query({
  args: { tenantSlug: v.string(), lessonSlug: v.string() },
  handler: async (ctx, args): Promise<MateriDetail> => {
    const { userId, tenant, role } = await requireMemberForTenantSlug(ctx, args.tenantSlug);
    if (!isLessonSlug(args.lessonSlug)) fail("NOT_FOUND", "Materi tidak ditemukan");
    const lesson = await ctx.db
      .query("lessons")
      .withIndex("by_tenant_slug", (q) =>
        q.eq("tenantId", tenant._id).eq("slug", args.lessonSlug)
      )
      .unique();
    if (lesson === null || !canSeeMateri(lesson, role)) {
      fail("NOT_FOUND", "Materi tidak ditemukan");
    }

    const tags = await loadTags(ctx, lesson._id);
    const courses = await loadTeachingCourses(ctx, lesson, role);
    const backlinks = await loadBacklinkMateri(ctx, lesson, role);
    return {
      _id: lesson._id,
      tenantId: lesson.tenantId,
      slug: lesson.slug ?? null,
      title: lesson.title,
      status: lesson.status ?? "published",
      kind: materiKind(lesson),
      // The prompt panel's data, MEMBER+ only — the anonymous twin above returns
      // `kind` and stops. Undefined on a materi, and on a promptless skill.
      promptText: lesson.promptText,
      youtubeVideoId: lesson.youtubeVideoId,
      contentMd: lesson.contentMd,
      contentBlocks: lesson.contentBlocks,
      links: lesson.links,
      tags,
      courses,
      backlinks,
      viewerRole: role,
      canEdit: isInstructorPlus(role) || lesson.authorId === userId,
      createdAt: lesson._creationTime,
    };
  },
});

/**
 * MEMBER+. "Muncul di" for one materi — the materi pages that reference it AND
 * the courses that teach it. Split out from `getBySlug` so a panel can refresh
 * without refetching the body.
 */
export const backlinksFor = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args): Promise<MateriBacklinks> => {
    const { lesson, role } = await requireMemberForLesson(ctx, args.lessonId);
    return {
      materi: await loadBacklinkMateri(ctx, lesson, role),
      courses: await loadTeachingCourses(ctx, lesson, role),
    };
  },
});

/**
 * MEMBER+. Resolve a materi id to its canonical slug — the one hop a caller
 * needs to turn an in-course lesson id into the shareable /materi/<slug> URL
 * (notification hrefs and search hits point at that URL).
 */
export const getSlug = query({
  args: { lessonId: v.id("lessons") },
  handler: async (ctx, args): Promise<{ slug: string | null; title: string }> => {
    const { lesson } = await requireMemberForLesson(ctx, args.lessonId);
    return { slug: lesson.slug ?? null, title: lesson.title };
  },
});
