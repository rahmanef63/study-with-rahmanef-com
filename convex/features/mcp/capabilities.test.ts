import { expect, test } from "vitest";
import { api, internal } from "../../_generated/api";
import type { Id } from "../../_generated/dataModel";
import { hashMcpToken } from "./crypto";
import { setupMcp } from "./test.helpers";

async function execute(fx: Awaited<ReturnType<typeof setupMcp>>, capability: string, args: Record<string, unknown> = {}, mode: "user" | "admin" = "user") {
  const token = mode === "admin" ? fx.adminToken.token : fx.userToken.token;
  const result = await fx.t.action(api.features.mcp.bridge.execute, { token, scope: mode, capability, argumentsJson: JSON.stringify(args) });
  return JSON.parse(result.resultJson);
}

test("discovery is scope-isolated and capability metadata/schema mirrors actual bounded inputs", async () => {
  const fx = await setupMcp();
  const users = await fx.t.action(api.features.mcp.bridge.discover, { token: fx.userToken.token, scope: "user" });
  const admins = await fx.t.action(api.features.mcp.bridge.discover, { token: fx.adminToken.token, scope: "admin" });
  expect(users).toHaveLength(12);
  expect(admins).toHaveLength(7);
  expect(users.every(item => item.id.startsWith("user."))).toBe(true);
  expect(admins.every(item => item.id.startsWith("admin."))).toBe(true);
  expect(users.find(c => c.id === "user.comment_add")).toMatchObject({ readOnly: false, destructive: false, idempotent: false });
  expect(users.find(c => c.id === "user.comment_delete")).toMatchObject({ readOnly: false, destructive: true, idempotent: true });
  const learning = JSON.parse(admins.find(c => c.id === "admin.learning_analytics")!.inputSchemaJson);
  const traffic = JSON.parse(admins.find(c => c.id === "admin.traffic_analytics")!.inputSchemaJson);
  expect(learning.properties.days.enum).toEqual([7, 30, 90, 180, 365]);
  expect(traffic.properties.days.enum).toEqual([7, 30]);
  expect(learning.additionalProperties).toBe(false);
  for (const scope of ["user", "admin"] as const) {
    await expect(fx.t.action(api.features.mcp.bridge.discover, { token: "study_mcp_user_" + "0".repeat(64), scope })).rejects.toThrow(/NOT_AUTHENTICATED/);
  }
});

test("read parity uses own browser profile/memberships/course/progress/lesson/comments, never a supplied actor", async () => {
  const fx = await setupMcp();
  const cases = [
    ["user.profile", {}, fx.member.query(api.features.profiles.queries.getCurrentProfile, {})],
    ["user.communities", {}, fx.member.query(api.features.tenants.queries.listMine, {})],
    ["user.course_catalog", { tenantId: fx.tenantId }, fx.member.query(api.features.courses.queries.listPublished, { tenantId: fx.tenantId })],
    ["user.course_overview", { tenantId: fx.tenantId, courseSlug: "course" }, fx.member.query(api.features.courses.queries.getOverview, { tenantId: fx.tenantId, courseSlug: "course" })],
    ["user.course_progress", { courseId: fx.courseId }, fx.member.query(api.features.progress.queries.getCourseProgress, { courseId: fx.courseId })],
    ["user.lesson", { lessonId: fx.lessonId }, fx.member.query(api.features.courses.queries.getLesson, { lessonId: fx.lessonId })],
    ["user.lesson_comments", { lessonId: fx.lessonId }, fx.member.query(api.features.comments.queries.listByLesson, { lessonId: fx.lessonId })],
  ] as const;
  for (const [capability, args, browser] of cases) {
    expect(await execute(fx, capability, args)).toEqual(await browser);
  }
  for (const args of [{ userId: fx.adminId }, { profileId: fx.adminProfileId }]) {
    await expect(execute(fx, "user.profile", args)).rejects.toThrow(/VALIDATION_FAILED/);
  }
});

test("current membership, lesson publication and tenant status still guard MCP after issue", async () => {
  const fx = await setupMcp();
  await fx.t.run(ctx => ctx.db.patch(fx.lessonId, { status: "draft" }));
  await expect(execute(fx, "user.lesson", { lessonId: fx.lessonId })).rejects.toThrow(/NOT_FOUND/);
  await expect(execute(fx, "user.complete_lesson", { lessonId: fx.lessonId })).rejects.toThrow(/NOT_FOUND/);
  await fx.t.run(async ctx => { await ctx.db.patch(fx.lessonId, { status: "published" }); await ctx.db.delete(fx.memberMembershipId); });
  await expect(execute(fx, "user.lesson", { lessonId: fx.lessonId })).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(execute(fx, "user.comment_add", { lessonId: fx.lessonId, bodyMd: "Denied" })).rejects.toThrow(/NOT_AUTHORIZED/);
  await fx.t.run(async ctx => { await ctx.db.insert("memberships", { tenantId: fx.tenantId, userId: fx.memberId, role: "member" }); await ctx.db.patch(fx.tenantId, { status: "suspended" }); });
  await expect(execute(fx, "user.lesson", { lessonId: fx.lessonId })).rejects.toThrow(/NOT_FOUND/);
});

test("writes preserve progress/comment identities, idempotency, anti-spam and moderation permissions", async () => {
  const fx = await setupMcp();
  const first = await execute(fx, "user.complete_lesson", { lessonId: fx.lessonId });
  const second = await execute(fx, "user.complete_lesson", { lessonId: fx.lessonId });
  expect(first.wasAlreadyComplete).toBe(false);
  expect(second.wasAlreadyComplete).toBe(true);
  expect(await execute(fx, "user.course_progress", { courseId: fx.courseId })).toEqual(await fx.member.query(api.features.progress.queries.getCourseProgress, { courseId: fx.courseId }));
  const commentId: Id<"comments"> = await execute(fx, "user.comment_add", { lessonId: fx.lessonId, bodyMd: "My MCP comment" });
  const list = await execute(fx, "user.lesson_comments", { lessonId: fx.lessonId });
  expect(list.items[0]).toMatchObject({ _id: commentId, mine: true, bodyMd: "My MCP comment" });
  const stored = await fx.t.run(ctx => ctx.db.get(commentId));
  expect(stored?.userId).toBe(fx.memberId);
  expect(await execute(fx, "user.comment_delete", { commentId })).toBe(commentId);
  expect(await execute(fx, "user.comment_delete", { commentId })).toBe(commentId);
  const deleted = await execute(fx, "user.lesson_comments", { lessonId: fx.lessonId });
  expect(deleted.items.find((item: { _id: string }) => item._id === commentId)).toMatchObject({ deleted: true, bodyMd: null, author: null });
  const adminComment = await fx.admin.mutation(api.features.comments.comments.addComment, { lessonId: fx.lessonId, bodyMd: "Owner only" });
  await expect(execute(fx, "user.comment_delete", { commentId: adminComment })).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(execute(fx, "user.comment_add", { bodyMd: "No target" })).rejects.toThrow(/VALIDATION_FAILED/);
  await fx.t.run(async ctx => { for (let i = 0; i < 19; i++) await ctx.db.insert("comments", { tenantId: fx.tenantId, lessonId: fx.lessonId, userId: fx.memberId, bodyMd: "At cap", deletedAt: Date.now() }); });
  await expect(execute(fx, "user.comment_add", { lessonId: fx.lessonId, bodyMd: "Over cap" })).rejects.toThrow(/RATE_LIMITED/);
});

test("admin queries and approval/suspension match browser guards; member PAT cannot select privileged capability", async () => {
  const fx = await setupMcp();
  for (const days of [7, 30, 90, 180, 365] as const) expect(await execute(fx, "admin.learning_analytics", { days }, "admin")).toEqual(await fx.admin.query(api.features.analytics.platform.getPlatformAnalytics, { days }));
  expect(await execute(fx, "admin.traffic_analytics", { days: 7 }, "admin")).toEqual(await fx.admin.query(api.features.traffic.queries.getTrafficAnalytics, { days: 7 }));
  expect(await execute(fx, "admin.pending_communities", {}, "admin")).toEqual(await fx.admin.query(api.features.tenants.admin.listPending, {}));
  await expect(execute(fx, "admin.pending_communities")).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(execute(fx, "admin.traffic_analytics", { days: 90 }, "admin")).rejects.toThrow(/VALIDATION_FAILED/);
  expect(await execute(fx, "admin.suspend_community", { tenantId: fx.tenantId }, "admin")).toEqual({ slug: "test", status: "suspended" });
  expect(await execute(fx, "admin.approve_community", { tenantId: fx.tenantId }, "admin")).toEqual({ slug: "test", status: "active" });
  expect(await execute(fx, "admin.approve_community", { tenantId: fx.tenantId }, "admin")).toEqual({ slug: "test", status: "active" });
});

test("backend rechecks token at internal delegation and validates arbitrary JSON/IDs before original handler", async () => {
  const fx = await setupMcp();
  for (const args of [{ days: 1 }, { days: "7" }, { days: 7, userId: fx.adminId }]) await expect(execute(fx, "admin.learning_analytics", args, "admin")).rejects.toThrow(/VALIDATION_FAILED/);
  for (const argumentsJson of ["[]", "null", "not-json", "{}".repeat(10_000)]) await expect(fx.t.action(api.features.mcp.bridge.execute, { token: fx.userToken.token, scope: "user", capability: "user.profile", argumentsJson })).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(execute(fx, "user.course_progress", { courseId: fx.lessonId })).rejects.toThrow(/VALIDATION_FAILED/);
  const tokenHash = await hashMcpToken(fx.userToken.token);
  await fx.member.mutation(api.features.mcp.tokens.revoke, { tokenId: fx.userToken.tokenId });
  await expect(fx.t.query(internal.features.mcp.read.execute, { tokenHash, scope: "user", capability: "user.profile", argumentsJson: "{}" })).rejects.toThrow(/NOT_AUTHENTICATED/);
  await expect(fx.t.mutation(internal.features.mcp.write.execute, { tokenHash, scope: "user", capability: "user.complete_lesson", argumentsJson: JSON.stringify({ lessonId: fx.lessonId }) })).rejects.toThrow(/NOT_AUTHENTICATED/);
});

test("library preserves paginated materi/skill membership reads and strict cursor/kind/sort contract", async () => {
  const fx = await setupMcp();
  await fx.t.run(async ctx => {
    for (let i = 0; i < 2; i++) await ctx.db.insert("lessons", { tenantId: fx.tenantId, slug: `library-${i}`, title: `Library ${i}`, contentMd: "", links: [], status: "published" });
    await ctx.db.insert("lessons", { tenantId: fx.tenantId, slug: "skill", title: "Skill", contentMd: "", links: [], status: "published", kind: "skill" });
    await ctx.db.insert("lessons", { tenantId: fx.tenantId, slug: "draft", title: "Hidden", contentMd: "", links: [], status: "draft" });
  });
  const initial = await execute(fx, "user.library", { tenantId: fx.tenantId, kind: "materi", limit: 2 });
  expect(initial.page).toHaveLength(2);
  expect(initial.isDone).toBe(false);
  const next = await execute(fx, "user.library", { tenantId: fx.tenantId, kind: "materi", limit: 2, cursor: initial.continueCursor });
  expect(next.page).toHaveLength(1);
  expect(next.isDone).toBe(true);
  const skills = await execute(fx, "user.library", { tenantId: fx.tenantId, kind: "skill", sort: "title" });
  expect(skills.page).toHaveLength(1);
  expect(skills.page[0].title).toBe("Skill");
  for (const extra of [{ kind: "unknown" }, { sort: "global-title" }, { limit: 21 }]) await expect(execute(fx, "user.library", { tenantId: fx.tenantId, ...extra })).rejects.toThrow(/VALIDATION_FAILED/);
  await fx.t.run(ctx => ctx.db.delete(fx.memberMembershipId));
  await expect(execute(fx, "user.library", { tenantId: fx.tenantId })).rejects.toThrow(/NOT_AUTHORIZED/);
});

 test("admin user analytics delegate to guarded browser handlers with strict scope and IDs", async () => {
  const fx = await setupMcp();
  expect(await execute(fx, "admin.users", { limit: 20 }, "admin")).toEqual(await fx.admin.query(api.features.userAnalytics.users.listUsers, { paginationOpts: { numItems: 20, cursor: null } }));
  expect(await execute(fx, "admin.user_detail", { userId: fx.memberId }, "admin")).toEqual(await fx.admin.query(api.features.userAnalytics.users.getUserDetail, { userId: fx.memberId }));
  await expect(execute(fx, "admin.user_detail", { userId: fx.memberId })).rejects.toThrow(/NOT_AUTHORIZED/);
  await expect(execute(fx, "admin.user_detail", { userId: fx.lessonId }, "admin")).rejects.toThrow(/VALIDATION_FAILED/);
  await expect(execute(fx, "admin.users", { limit: 21 }, "admin")).rejects.toThrow(/VALIDATION_FAILED/);
});
