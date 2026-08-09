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

// ── the seed writes `posts`, never the retired boards (#33) ──────────────────
// seedContent / seedWorld / seedEngagement used to fill announcements,
// resources, suggestions and suggestionVotes. Those four tables are retired and
// awaiting the prod backfill, so the seed re-creating a single row in any of
// them would silently un-migrate the deployment — hence the emptiness
// assertions below, not just the happy path.

const seedArgs = { ownerEmail: args.ownerEmail, tenantSlug: args.tenantSlug };

async function bootstrapped() {
  const t = convexTest(schema, modules);
  await t.run(async (ctx) => {
    await ctx.db.insert("users", { email: args.ownerEmail });
  });
  await t.mutation(internal.seed.bootstrap, args);
  return t;
}

test("seedContent pins ONE welcome pengumuman, and re-running adds nothing", async () => {
  const t = await bootstrapped();

  const first = await t.mutation(internal.seed.seedContent, seedArgs);
  expect(first.posts).toBe(1);
  const second = await t.mutation(internal.seed.seedContent, seedArgs);
  expect(second.posts).toBe(0);

  await t.run(async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    expect(posts).toHaveLength(1);
    expect(posts[0].kind).toBe("pengumuman");
    expect(posts[0].pinned).toBe(true);
  });
});

test("seedEngagement fills the seedable post kinds and scores the leaderboard", async () => {
  const t = await bootstrapped();
  await t.mutation(internal.seed.seedContent, seedArgs);

  const first = await t.mutation(internal.seed.seedEngagement, seedArgs);
  expect(first.sumber).toBeGreaterThan(0);
  expect(first.usulan).toBeGreaterThan(0);
  expect(first.likes).toBeGreaterThan(0);

  await t.run(async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    // Three kinds, not four: "diskusi" is deliberately NOT seeded — that chip is
    // where real members talk, and filling it meant inventing conversation.
    expect(new Set(posts.map((p) => p.kind))).toEqual(
      new Set(["pengumuman", "sumber", "usulan"])
    );
    // A "sumber" post IS its link; the retired board's `url` lives in linkUrl.
    for (const p of posts.filter((x) => x.kind === "sumber")) {
      expect(p.linkUrl).toMatch(/^https:\/\//);
    }

    // Denormalised counter invariant: likeCount is the number of real rows.
    const likes = await ctx.db.query("postLikes").collect();
    expect(posts.reduce((n, p) => n + p.likeCount, 0)).toBe(likes.length);

    // Points: +1 per like, EXCEPT on your own post (mirrors likes.ts).
    const byId = new Map(posts.map((p) => [p._id, p]));
    const scoring = likes.filter((l) => byId.get(l.postId)?.authorId !== l.userId).length;
    expect(scoring).toBeGreaterThan(0);
    const memberships = await ctx.db.query("memberships").collect();
    expect(memberships.reduce((n, m) => n + (m.points ?? 0), 0)).toBe(scoring);

    // The retired boards used to be asserted at zero here. They are no longer
    // in the schema at all (backfilled, purged and dropped 2026-08-09), so the
    // property is now structural — a seed CANNOT write them.
  });

  const before = await t.run(async (ctx) => ({
    posts: (await ctx.db.query("posts").collect()).length,
    likes: (await ctx.db.query("postLikes").collect()).length,
    points: (await ctx.db.query("memberships").collect()).reduce(
      (n, m) => n + (m.points ?? 0),
      0
    ),
  }));

  const second = await t.mutation(internal.seed.seedEngagement, seedArgs);
  expect(second.sumber).toBe(0);
  expect(second.usulan).toBe(0);
  expect(second.likes).toBe(0);

  // Idempotent all the way down: no duplicate post, no double-counted point.
  await t.run(async (ctx) => {
    expect((await ctx.db.query("posts").collect()).length).toBe(before.posts);
    expect((await ctx.db.query("postLikes").collect()).length).toBe(before.likes);
    expect(
      (await ctx.db.query("memberships").collect()).reduce((n, m) => n + (m.points ?? 0), 0)
    ).toBe(before.points);
  });
});

test("seedWorld builds each extra community a pinned welcome + sumber posts", async () => {
  const t = await bootstrapped();

  const first = await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
  expect(first.tenants).toBeGreaterThan(0);
  expect(first.pengumuman).toBe(first.tenants); // one welcome per new community
  expect(first.sumber).toBeGreaterThan(0);

  await t.run(async (ctx) => {
    const posts = await ctx.db.query("posts").collect();
    for (const p of posts.filter((x) => x.kind === "pengumuman")) {
      expect(p.pinned).toBe(true);
    }
    // Every post belongs to the tenant it was seeded into — no cross-tenant leak.
    const tenants = new Set((await ctx.db.query("tenants").collect()).map((x) => x._id));
    for (const p of posts) expect(tenants.has(p.tenantId)).toBe(true);
  });

  const second = await t.mutation(internal.seed.seedWorld, { ownerEmail: args.ownerEmail });
  expect(second.tenants).toBe(0);
  expect(second.pengumuman).toBe(0);
  expect(second.sumber).toBe(0);
});
