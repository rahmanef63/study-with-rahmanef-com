import { expect, test } from "vitest";
import { allowedUserActivityPath, validActivityTarget, listUsersHandler, getUserDetailHandler } from "./index";
import { fixture } from "./test.helpers";

test("MCP-delegation barrel keeps platform authorization and returns guarded identity projections", async () => {
  const { t, admin, member, ids } = await fixture();
  const args = { paginationOpts: { numItems: 20, cursor: null } };
  await expect(t.run(ctx => listUsersHandler(ctx, args))).rejects.toThrow("NOT_AUTHENTICATED");
  await expect(member.run(ctx => getUserDetailHandler(ctx, { userId: ids.owner }))).rejects.toThrow("NOT_AUTHORIZED");
  const detail = await admin.run(ctx => getUserDetailHandler(ctx, { userId: ids.member }));
  expect(detail.user.userId).toBe(ids.member);
  expect(detail.courses[0].total).toBe(1);
  expect(JSON.stringify(detail)).not.toContain("correctIndex");
  expect(JSON.stringify(detail)).not.toContain("discordWebhookUrl");
});

test("authenticated telemetry barrel exposes actual route vocabulary and blocks identity/settings targets", () => {
  expect(allowedUserActivityPath("/k/fixture/kelas/dasar/jabc123")).toBe(true);
  expect(validActivityTarget("https://example.test/resource")).toBe(true);
  expect(validActivityTarget("https://study-with.rahmanef.com/u/member")).toBe(false);
  expect(allowedUserActivityPath("/pengaturan/mcp")).toBe(false);
});
