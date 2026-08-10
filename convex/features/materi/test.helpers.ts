/// <reference types="vite/client" />
// Shared fixture for the materi convex-test specs.
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
// Local copy rather than an import from features/courses: a feature never
// reaches into another feature's files (AGENTS.md §4).
import { convexTest } from "convex-test";
import type { Id } from "../../_generated/dataModel";
import schema from "../../schema";

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
  tenantSlug: string;
  ownerId: Id<"users">;
  instructorId: Id<"users">;
  memberId: Id<"users">;
  outsiderId: Id<"users">;
};

/** Active tenant + one user per role (outsider has NO membership). */
export async function seedTenantFixture(t: T, slug = "komunitas-test"): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug,
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec materi",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, tenantSlug: slug, ownerId, instructorId, memberId, outsiderId };
  });
}

type MateriOptions = {
  slug?: string | null;
  title?: string;
  /** `undefined` writes NO status column — the pre-migration row shape. */
  status?: "draft" | "published";
  authorId?: Id<"users">;
  withVideo?: boolean;
  tags?: string[];
};

/** A standalone materi in NO course — the post-migration default shape. */
export async function seedMateri(
  t: T,
  fx: TenantFixture,
  options: MateriOptions = {}
): Promise<Id<"lessons">> {
  const { slug = "materi-satu", title = "Materi Satu", status, authorId, withVideo, tags } = options;
  return await t.run(async (ctx) => {
    const lessonId = await ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      title,
      slug: slug ?? undefined,
      status,
      authorId: authorId ?? fx.instructorId,
      youtubeVideoId: withVideo === true ? "dQw4w9WgXcQ" : undefined,
      contentMd: "# Halo\n\nIsi materi rahasia member.",
      links: [{ label: "Dokumentasi", url: "https://example.com/docs" }],
    });
    for (const tag of tags ?? []) {
      await ctx.db.insert("lessonTags", { tenantId: fx.tenantId, tag, lessonId });
    }
    return lessonId;
  });
}

/** A course, optionally teaching `lessonIds` in the given order. */
export async function seedCourse(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived",
  lessonIds: Array<Id<"lessons">> = [],
  slug = `kelas-${status}`
): Promise<Id<"courses">> {
  return await t.run(async (ctx) => {
    const courseId = await ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug,
      title: `Kelas ${status}`,
      description: "Deskripsi kelas fixture",
      status,
      createdBy: fx.instructorId,
    });
    let order = 0;
    for (const lessonId of lessonIds) {
      await ctx.db.insert("courseLessons", {
        tenantId: fx.tenantId,
        courseId,
        lessonId,
        order: order++,
      });
    }
    return courseId;
  });
}

/** A materi→materi reference row, as the save path would write it. */
export async function seedRef(
  t: T,
  fx: TenantFixture,
  fromLessonId: Id<"lessons">,
  toLessonId: Id<"lessons">
): Promise<void> {
  await t.run(async (ctx) => {
    await ctx.db.insert("lessonRefs", { tenantId: fx.tenantId, fromLessonId, toLessonId });
  });
}
