/// <reference types="vite/client" />
// Harness proof + seed coverage (DoD §5.2: every mutation incl. denied paths).
import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";

// convex-test needs the function modules of this directory.
const modules = import.meta.glob(["./**/*.{js,ts}", "!./**/*.test.ts", "!./**/*.d.ts"]);

const args = {
  ownerEmail: "rahmanef63@gmail.com",
  username: "rahman",
  displayName: "Rahman",
  tenantSlug: "belajar-ai",
  tenantName: "Belajar AI bareng Rahman",
  tenantDescription: "Komunitas belajar pengaplikasian AI untuk semua orang.",
};

test("bootstrap rejects when the owner has never logged in", async () => {
  const t = convexTest(schema, modules);
  await expect(t.mutation(internal.seed.bootstrap, args)).rejects.toThrow(
    /log in once/i
  );
});

test("bootstrap creates tenant + owner membership, idempotently", async () => {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: args.ownerEmail });
  });

  const first = await t.mutation(internal.seed.bootstrap, args);
  expect(first.tenantSlug).toBe(args.tenantSlug);

  const second = await t.mutation(internal.seed.bootstrap, args);
  expect(second.tenantId).toBe(first.tenantId);

  await t.run(async (ctx) => {
    const memberships = await ctx.db.query("memberships").collect();
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe("owner");
    const profiles = await ctx.db.query("profiles").collect();
    expect(profiles[0].isPlatformAdmin).toBe(true);
  });
});
