/// <reference types="vite/client" />
// Shared fixture for search convex-test specs (pattern: convex/seed.test.ts +
// courses/test.helpers.ts — duplicated per feature because cross-feature deep
// imports are off-limits; only _shared is common ground).
// Roles covered: owner / instructor / member / outsider (no membership).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

// Absolute glob keeps every key rooted at /convex so convex-test can resolve
// nested function paths consistently from this nested helper.
export const modules = import.meta.glob([
  "/convex/**/*.{js,ts}",
  "!/convex/**/*.test.ts",
  "!/convex/**/*.d.ts",
]);

export function setup() {
  return convexTest(schema, modules);
}

export type T = ReturnType<typeof setup>;

/** @convex-dev/auth identity: JWT subject is `${userId}|${sessionId}`. */
export function asUser(userId: Id<"users">) {
  return { subject: `${userId}|test-session` };
}

export type TenantFixture = {
  tenantId: Id<"tenants">;
  ownerId: Id<"users">;
  instructorId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(
  t: T,
  slug = "komunitas-test"
): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: `owner@${slug}.id` });
    const instructorId = await ctx.db.insert("users", { email: `guru@${slug}.id` });
    const memberId = await ctx.db.insert("users", { email: `member@${slug}.id` });
    const outsiderId = await ctx.db.insert("users", { email: `luar@${slug}.id` });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: `Komunitas ${slug}`,
      description: "Tenant fixture untuk spec search",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

export type CourseFixture = {
  courseId: Id<"courses">;
  lessonId: Id<"lessons">;
};

export type SeedCourseOpts = {
  status: "draft" | "published" | "archived";
  slug: string;
  title: string;
  lessonTitle?: string;
  contentMd?: string;
  /** Materi handle — the canonical URL segment. Defaults to `<slug>-materi`. */
  lessonSlug?: string;
  /** Materi visibility. `undefined` reproduces a pre-migration row. */
  lessonStatus?: "draft" | "published";
};

/**
 * Course + 1 materi PLACED in it (courseLessons), with controllable searchable
 * text. The materi is tenant-owned (DECISIONS #36/#37); the placement row is
 * the only thing tying it to the course.
 */
export async function seedCourseWithLesson(
  t: T,
  fx: TenantFixture,
  opts: SeedCourseOpts
): Promise<CourseFixture> {
  return await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug: opts.slug,
      title: opts.title,
      description: "Deskripsi kelas fixture",
      status: opts.status,
      createdBy: fx.instructorId,
    });
    const lessonId = await ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      slug: opts.lessonSlug ?? `${opts.slug}-materi`,
      status: opts.lessonStatus,
      title: opts.lessonTitle ?? "Lesson 1",
      contentMd: opts.contentMd ?? "Materi pertama.",
      links: [],
    });
    await ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId, lessonId, order: 1 });
    return { courseId, lessonId };
  });
}

/** A standalone materi: tenant-owned, in NO course at all (library only). */
export async function seedMateri(
  t: T,
  fx: TenantFixture,
  opts: { slug?: string; status?: "draft" | "published"; title?: string; contentMd?: string }
): Promise<Id<"lessons">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      slug: opts.slug,
      status: opts.status,
      title: opts.title ?? "Materi mandiri",
      contentMd: opts.contentMd ?? "Materi mandiri.",
      links: [],
    })
  );
}

export type SeedPostOpts = {
  title: string;
  kind?: "diskusi" | "pengumuman" | "usulan" | "sumber";
  bodyMd?: string;
  linkUrl?: string;
  /** Soft-deleted rows must never reach a search result (P0). */
  deleted?: boolean;
  /** Defaults to the member; pass another id to test cross-author feeds. */
  authorId?: Id<"users">;
};

/**
 * Diskusi post row (v1.8 #33) — the third search source. Replaces the retired
 * seedResource helper; `deleted` is the invariant that used to be `status`.
 */
export async function seedPost(t: T, fx: TenantFixture, opts: SeedPostOpts) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("posts", {
      tenantId: fx.tenantId,
      authorId: opts.authorId ?? fx.memberId,
      kind: opts.kind ?? "sumber",
      title: opts.title,
      bodyMd: opts.bodyMd ?? "Catatan internal yang TIDAK boleh bocor",
      linkUrl: opts.linkUrl,
      pinned: false,
      lastActivityAt: Date.now(),
      likeCount: 0,
      commentCount: 0,
      deletedAt: opts.deleted === true ? Date.now() : undefined,
    });
  });
}
