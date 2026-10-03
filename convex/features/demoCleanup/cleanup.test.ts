/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { internal } from "../../_generated/api";
import schema from "../../schema";
import { SEED_MEMBERS, SEED_THREADS } from "../../_seed/engagementData";
const modules = import.meta.glob(["/convex/**/*.{js,ts}", "!/convex/**/*.test.ts", "!/convex/**/*.d.ts"]);
const cleanup = internal.features.demoCleanup.cleanup;
const confirmation = "DELETE_VERIFIED_SEED_ACCOUNTS" as const;

async function fixture() {
  const t = convexTest(schema, modules);
  const ids = await t.run(async (ctx) => {
    const owner = await ctx.db.insert("users", { email: "real-owner@gmail.com" });
    await ctx.db.insert("profiles", { userId: owner, username: "owner", displayName: "Owner", isPlatformAdmin: true });
    const real = await ctx.db.insert("users", { email: "real@gmail.com" });
    await ctx.db.insert("profiles", { userId: real, username: "real", displayName: "Real" });
    await ctx.db.insert("authAccounts", { userId: real, provider: "google", providerAccountId: "google-real" });
    const tenant = await ctx.db.insert("tenants", { slug: "belajar-ai", name: "Belajar AI", description: "Real", status: "active", ownerId: owner });
    await ctx.db.insert("memberships", { tenantId: tenant, userId: owner, role: "owner", points: 5 });
    await ctx.db.insert("memberships", { tenantId: tenant, userId: real, role: "member", points: 9 });
    const seed = SEED_MEMBERS[0];
    const demo = await ctx.db.insert("users", { email: seed.email, name: seed.displayName });
    await ctx.db.insert("profiles", { userId: demo, username: seed.username, displayName: seed.displayName, bio: seed.bio });
    await ctx.db.insert("memberships", { tenantId: tenant, userId: demo, role: "member", points: 2 });
    const lesson = await ctx.db.insert("lessons", { tenantId: tenant, title: "Real lesson", contentMd: "Real teaching", authorId: owner, links: [] });
    const root = await ctx.db.insert("comments", { tenantId: tenant, userId: demo, lessonId: lesson, bodyMd: SEED_THREADS[0].root.bodyMd });
    const scripted = await ctx.db.insert("comments", { tenantId: tenant, userId: owner, lessonId: lesson, parentId: root, bodyMd: SEED_THREADS[0].reply!.bodyMd });
    const reply = await ctx.db.insert("comments", { tenantId: tenant, userId: real, lessonId: lesson, parentId: root, bodyMd: "My actual response" });
    const post = await ctx.db.insert("posts", { tenantId: tenant, authorId: owner, kind: "sumber", title: "Real resource", bodyMd: "Keep", pinned: false, lastActivityAt: Date.now(), likeCount: 2, commentCount: 0 });
    await ctx.db.insert("postLikes", { tenantId: tenant, userId: demo, postId: post });
    const realLike = await ctx.db.insert("postLikes", { tenantId: tenant, userId: real, postId: post });
    const demoPost = await ctx.db.insert("posts", { tenantId: tenant, authorId: demo, kind: "usulan", title: "Demo suggestion", bodyMd: "Fake", pinned: false, lastActivityAt: Date.now(), likeCount: 1, commentCount: 0 });
    await ctx.db.insert("postLikes", { tenantId: tenant, userId: owner, postId: demoPost });
    const rollup = await ctx.db.insert("materiViewCounts", { tenantId: tenant, lessonId: lesson, views: 3, viewers: 2, lastViewedAt: Date.now() });
    await ctx.db.insert("materiViews", { tenantId: tenant, lessonId: lesson, userId: demo, day: "2026-10-01" });
    await ctx.db.insert("materiViews", { tenantId: tenant, lessonId: lesson, userId: demo, day: "2026-10-02" });
    const realView = await ctx.db.insert("materiViews", { tenantId: tenant, lessonId: lesson, userId: real, day: "2026-10-02" });
    return { owner, real, tenant, demo, lesson, root, scripted, reply, post, demoPost, rollup, realLike, realView };
  });
  const admin = t.withIdentity({ subject: `${ids.owner}|operator-test` });
  return { t, admin, ids };
}

describe("verified demo cleanup", () => {
  test("requires platform admin before reads even though operator-only", async () => {
    const { t, ids } = await fixture();
    await expect(t.query(cleanup.preview, { userIds: [ids.demo] })).rejects.toThrow("Silakan login");
    await expect(t.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).rejects.toThrow("Silakan login");
    const regular = t.withIdentity({ subject: `${ids.real}|session` });
    await expect(regular.query(cleanup.preview, { userIds: [ids.demo] })).rejects.toThrow("platform admin");
    await expect(regular.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).rejects.toThrow("platform admin");
  });

  test("dry run is read-only; cleanup preserves real data and reconciles counters atomically", async () => {
    const { t, admin, ids } = await fixture();
    const plan = await admin.query(cleanup.preview, { userIds: [ids.demo] });
    expect(plan).toMatchObject({ users: 1, memberships: 1, comments: 2, promotedReplies: 1, posts: 1, postLikes: 2, materiViews: 2 });
    expect(await t.run((ctx) => ctx.db.get(ids.demo))).not.toBeNull();
    expect(await admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).toEqual(plan);
    await t.run(async (ctx) => {
      expect(await ctx.db.get(ids.demo)).toBeNull();
      expect(await ctx.db.get(ids.root)).toBeNull();
      expect(await ctx.db.get(ids.scripted)).toBeNull();
      expect(await ctx.db.get(ids.demoPost)).toBeNull();
      expect(await ctx.db.get(ids.reply)).toMatchObject({ bodyMd: "My actual response", userId: ids.real });
      expect((await ctx.db.get(ids.reply))?.parentId).toBeUndefined();
      expect(await ctx.db.get(ids.post)).toMatchObject({ likeCount: 1, title: "Real resource" });
      expect(await ctx.db.get(ids.realLike)).not.toBeNull();
      expect(await ctx.db.get(ids.realView)).not.toBeNull();
      expect(await ctx.db.get(ids.lesson)).toMatchObject({ contentMd: "Real teaching" });
      expect(await ctx.db.get(ids.rollup)).toMatchObject({ views: 1, viewers: 1 });
      expect(await ctx.db.query("memberships").withIndex("by_tenant_user", (q) => q.eq("tenantId", ids.tenant).eq("userId", ids.owner)).unique()).toMatchObject({ points: 4 });
      expect(await ctx.db.get(ids.real)).not.toBeNull();
    });
    expect(await admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).toMatchObject({ users: 0, comments: 0, postLikes: 0 });
  });

  test("removes demo learning records/inbox and keeps corresponding real-user records", async () => {
    const { t, admin, ids } = await fixture();
    const realRows = await t.run(async (ctx) => {
      const course = await ctx.db.insert("courses", { tenantId: ids.tenant, slug: "course", title: "Course", description: "Real", status: "published", createdBy: ids.owner });
      const quiz = await ctx.db.insert("quizzes", { tenantId: ids.tenant, courseId: course, title: "Quiz", passingScorePct: 60, questions: [] });
      const realRows = [];
      for (const userId of [ids.demo, ids.real]) {
        const rows = [
          await ctx.db.insert("lessonCompletions", { tenantId: ids.tenant, userId, courseId: course, lessonId: ids.lesson }),
          await ctx.db.insert("courseCompletions", { tenantId: ids.tenant, userId, courseId: course }),
          await ctx.db.insert("quizAttempts", { tenantId: ids.tenant, userId, quizId: quiz, answers: [], scorePct: 80, passed: true }),
          await ctx.db.insert("notifications", { tenantId: ids.tenant, userId, kind: "announcement", title: "Keep real inbox" }),
          await ctx.db.insert("learnerProfiles", { tenantId: ids.tenant, userId, answers: [], level: "pemula", pathSlugs: [], updatedAt: Date.now() }),
        ];
        if (userId === ids.real) realRows.push(...rows);
      }
      return realRows;
    });
    expect(await admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).toMatchObject({ lessonCompletions: 1, courseCompletions: 1, quizAttempts: 1, notifications: 1, learnerProfiles: 1 });
    await t.run(async (ctx) => {
      for (const id of realRows) expect(await ctx.db.get(id)).not.toBeNull();
      for (const table of ["lessonCompletions", "courseCompletions", "quizAttempts", "notifications", "learnerProfiles"] as const) {
        const rows = await ctx.db.query(table).collect();
        expect(rows).toHaveLength(1);
        expect(rows[0].userId).toBe(ids.real);
      }
    });
  });

  test("removes an all-demo view rollup instead of leaving a synthetic last-activity timestamp", async () => {
    const { t, admin, ids } = await fixture();
    await t.run(async (ctx) => {
      await ctx.db.delete(ids.realView);
      await ctx.db.patch(ids.rollup, { views: 2, viewers: 1 });
    });
    await admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation });
    expect(await t.run((ctx) => ctx.db.get(ids.rollup))).toBeNull();
  });

  test("rejects real users and an entire mixed batch without partial mutation", async () => {
    const { t, admin, ids } = await fixture();
    await expect(admin.mutation(cleanup.execute, { userIds: [ids.demo, ids.real], confirmation })).rejects.toThrow("verifikasi");
    expect(await t.run((ctx) => ctx.db.get(ids.demo))).not.toBeNull();
  });

  test.each(["authAccount", "authSession", "admin", "changedProfile", "instructor", "owner", "teaching", "token", "activityBudget", "avatar", "anonymous"])("preserves seed-looking account when evidence changed: %s", async (protect) => {
    const { t, admin, ids } = await fixture();
    await t.run(async (ctx) => {
      const profile = await ctx.db.query("profiles").withIndex("by_user", (q) => q.eq("userId", ids.demo)).unique();
      const member = await ctx.db.query("memberships").withIndex("by_tenant_user", (q) => q.eq("tenantId", ids.tenant).eq("userId", ids.demo)).unique();
      if (protect === "authAccount") await ctx.db.insert("authAccounts", { userId: ids.demo, provider: "google", providerAccountId: "demo-now-real" });
      if (protect === "authSession") await ctx.db.insert("authSessions", { userId: ids.demo, expirationTime: Date.now() + 1000 });
      if (protect === "admin") await ctx.db.patch(profile!._id, { isPlatformAdmin: true });
      if (protect === "changedProfile") await ctx.db.patch(profile!._id, { bio: "Changed by a human" });
      if (protect === "instructor") await ctx.db.patch(member!._id, { role: "instructor" });
      if (protect === "owner") await ctx.db.patch(ids.tenant, { ownerId: ids.demo });
      if (protect === "teaching") await ctx.db.patch(ids.lesson, { authorId: ids.demo });
      if (protect === "activityBudget") await ctx.db.insert("userActivityBudgets", { userId: ids.demo, minuteResetAt: 1, minuteCount: 1, dayResetAt: 1, dayCount: 1, expiresAt: Date.now() + 1000 });
      if (protect === "avatar") await ctx.db.patch(profile!._id, { avatarUrl: "https://example.com/profile.jpg" });
      if (protect === "anonymous") await ctx.db.patch(ids.demo, { isAnonymous: true });
      if (protect === "token") await ctx.db.insert("mcpTokens", { userId: ids.demo, tokenHash: "hash", label: "Real", scope: "user", expiresAt: Date.now() + 1000 });
    });
    await expect(admin.query(cleanup.preview, { userIds: [ids.demo] })).rejects.toThrow("verifikasi");
    await expect(admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).rejects.toThrow("verifikasi");
    expect(await t.run((ctx) => ctx.db.get(ids.demo))).not.toBeNull();
  });

  test("retains real replies to a demo post as a tombstone without dangling author", async () => {
    const { t, admin, ids } = await fixture();
    const realReply = await t.run(async (ctx) => {
      await ctx.db.patch(ids.demoPost, { commentCount: 1 });
      return ctx.db.insert("comments", { tenantId: ids.tenant, postId: ids.demoPost, userId: ids.real, bodyMd: "Actual post reply" });
    });
    expect(await admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).toMatchObject({ posts: 0, postTombstones: 1 });
    await t.run(async (ctx) => {
      expect(await ctx.db.get(realReply)).toMatchObject({ bodyMd: "Actual post reply" });
      expect(await ctx.db.get(ids.demoPost)).toMatchObject({ authorId: ids.owner, title: "Konten demo dihapus", likeCount: 0, commentCount: 1 });
      expect((await ctx.db.get(ids.demoPost))?.deletedAt).toBeTypeOf("number");
    });
  });

  test("over-cap source fails closed; duplicate and oversized manifests are rejected", async () => {
    const { t, admin, ids } = await fixture();
    await expect(admin.query(cleanup.preview, { userIds: [ids.demo, ids.demo] })).rejects.toThrow("verifikasi");
    await expect(admin.query(cleanup.preview, { userIds: [] })).rejects.toThrow("verifikasi");
    await expect(admin.query(cleanup.preview, { userIds: [ids.demo, ids.real, ids.owner, ids.tenant as unknown as typeof ids.demo] })).rejects.toThrow();
    await t.run(async (ctx) => {
      for (let index = 0; index < 201; index++) await ctx.db.insert("notifications", { tenantId: ids.tenant, userId: ids.demo, kind: "announcement", title: "Demo" });
    });
    await expect(admin.mutation(cleanup.execute, { userIds: [ids.demo], confirmation })).rejects.toThrow("verifikasi");
    expect(await t.run((ctx) => ctx.db.get(ids.demo))).not.toBeNull();
  });
});
