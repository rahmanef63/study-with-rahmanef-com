/// <reference types="vite/client" />
// Shared fixture for courses convex-test specs (pattern: convex/seed.test.ts).
// Roles covered: owner / instructor / member / outsider (no membership) —
// every spec exercises the authz-denied path with these (DoD §5.2, P0).
// MATERI model: a course owns nothing; `courseLessons` places tenant-level
// materi into it, so the fixtures seed the two separately.
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
export async function seedTenantFixture(t: T): Promise<TenantFixture> {
  return await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", { email: "owner@test.id" });
    const instructorId = await ctx.db.insert("users", { email: "guru@test.id" });
    const memberId = await ctx.db.insert("users", { email: "member@test.id" });
    const outsiderId = await ctx.db.insert("users", { email: "luar@test.id" });
    const tenantId = await ctx.db.insert("tenants", {
      slug: "komunitas-test",
      name: "Komunitas Test",
      description: "Tenant fixture untuk spec courses",
      status: "active",
      ownerId,
    });
    await ctx.db.insert("memberships", { tenantId, userId: ownerId, role: "owner" });
    await ctx.db.insert("memberships", { tenantId, userId: instructorId, role: "instructor" });
    await ctx.db.insert("memberships", { tenantId, userId: memberId, role: "member" });
    return { tenantId, ownerId, instructorId, memberId, outsiderId };
  });
}

/** A standalone materi — in NO course until placeMateri puts it in one. */
export async function seedMateri(
  t: T,
  fx: TenantFixture,
  opts: {
    title?: string;
    slug?: string;
    status?: "draft" | "published";
    /** undefined = a pre-migration row: no `status` column at all. */
    omitStatus?: boolean;
    withVideo?: boolean;
  } = {}
): Promise<Id<"lessons">> {
  const title = opts.title ?? "Materi 1";
  return await t.run(async (ctx) =>
    ctx.db.insert("lessons", {
      tenantId: fx.tenantId,
      title,
      slug: opts.slug ?? title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      status: opts.omitStatus === true ? undefined : (opts.status ?? "published"),
      authorId: fx.instructorId,
      youtubeVideoId: opts.withVideo === false ? undefined : "dQw4w9WgXcQ",
      contentMd: `# ${title}\n\nMateri pertama.`,
      links: [{ label: "Dokumentasi", url: "https://example.com/docs" }],
    })
  );
}

/** Place a materi into a course at `order`. */
export async function placeMateri(
  t: T,
  fx: TenantFixture,
  courseId: Id<"courses">,
  lessonId: Id<"lessons">,
  order = 1
): Promise<Id<"courseLessons">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("courseLessons", { tenantId: fx.tenantId, courseId, lessonId, order })
  );
}

export type CourseFixture = {
  courseId: Id<"courses">;
  lessonId: Id<"lessons">;
  placementId: Id<"courseLessons">;
};

/** Course in the given status + one PUBLISHED materi placed at order 1. */
export async function seedCourse(
  t: T,
  fx: TenantFixture,
  status: "draft" | "published" | "archived",
  slug = `kelas-${status}`
): Promise<CourseFixture> {
  const courseId = await t.run(async (ctx) =>
    ctx.db.insert("courses", {
      tenantId: fx.tenantId,
      slug,
      title: `Kelas ${status}`,
      description: "Deskripsi kelas fixture",
      coverImageUrl: "https://example.com/cover.jpg",
      status,
      createdBy: fx.instructorId,
    })
  );
  const lessonId = await seedMateri(t, fx, { title: "Materi 1", slug: `materi-1-${slug}` });
  const placementId = await placeMateri(t, fx, courseId, lessonId, 1);
  return { courseId, lessonId, placementId };
}
