/// <reference types="vite/client" />
// One-shot backfill specs (v1.8 #33) — the three retired boards → posts.
// Covers every rule the integrator will rely on when running this against prod:
// field mapping, pinned pengumuman, pending-migrates / rejected-skips, vote →
// like + likeCount + points, source _creationTime preserved in lastActivityAt,
// IDEMPOTENCY (a second full run inserts nothing), and `remaining` as the gate
// that must read zero before the tables are dropped.
import { expect, test } from "vitest";
import { makeFunctionReference } from "convex/server";
import type { Doc } from "../../_generated/dataModel";
import { backfillRunRef } from "./refs";
import { seedTenantFixture, setup, type T, type TenantFixture } from "./test.helpers";

type RemainingResult = {
  announcements: number;
  resources: number;
  rejectedResources: number;
  suggestions: number;
  votes: number;
  atLeast: boolean;
};

const remainingRef = makeFunctionReference<"query", { probe?: number }, RemainingResult>(
  "features/posts/backfill:remaining"
);

/** Drive the self-rescheduling chain to completion (4 phases, tiny fixtures). */
async function runToCompletion(t: T) {
  await t.mutation(backfillRunRef, {});
  for (let i = 0; i < 8; i++) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    await t.finishInProgressScheduledFunctions();
  }
}

async function posts(t: T): Promise<Doc<"posts">[]> {
  return await t.run(async (ctx) => ctx.db.query("posts").collect());
}

/** The whole legacy world: 1 announcement, 3 resources, 1 suggestion, 2 votes. */
async function seedLegacy(t: T, fx: TenantFixture) {
  return await t.run(async (ctx) => {
    const announcementId = await ctx.db.insert("announcements", {
      tenantId: fx.tenantId,
      title: "Kelas baru dibuka",
      bodyMd: "Pendaftaran mulai Senin.",
      createdBy: fx.instructorId,
      postedToDiscord: true,
    });
    const approvedId = await ctx.db.insert("resources", {
      tenantId: fx.tenantId,
      title: "Panduan Prompt",
      url: "https://contoh.id/panduan",
      note: "Bagus untuk pemula.",
      submittedBy: fx.memberId,
      status: "approved",
      reviewedBy: fx.ownerId,
    });
    // No note: bodyMd must become "" and the post must still be valid.
    await ctx.db.insert("resources", {
      tenantId: fx.tenantId,
      title: "Menunggu Kurator",
      url: "https://contoh.id/pending",
      submittedBy: fx.memberId,
      status: "pending",
    });
    await ctx.db.insert("resources", {
      tenantId: fx.tenantId,
      title: "Ditolak Kurator",
      url: "https://contoh.id/ditolak",
      submittedBy: fx.memberId,
      status: "rejected",
      reviewedBy: fx.ownerId,
    });
    const suggestionId = await ctx.db.insert("suggestions", {
      tenantId: fx.tenantId,
      title: "Usul kelas RAG",
      detail: "Materi retrieval augmented generation.",
      submittedBy: fx.memberId,
      status: "planned",
    });
    // One vote from ANOTHER member (scores a point) + one SELF vote (never does).
    await ctx.db.insert("suggestionVotes", {
      tenantId: fx.tenantId,
      suggestionId,
      userId: fx.ownerId,
    });
    await ctx.db.insert("suggestionVotes", {
      tenantId: fx.tenantId,
      suggestionId,
      userId: fx.memberId,
    });
    return { announcementId, approvedId, suggestionId };
  });
}

async function fixture() {
  const t = setup();
  const fx = await seedTenantFixture(t);
  const legacy = await seedLegacy(t, fx);
  return { t, fx, legacy };
}

function byTitle(rows: Doc<"posts">[], title: string) {
  const row = rows.find((p) => p.title === title);
  expect(row, `missing migrated post: ${title}`).toBeDefined();
  return row!;
}

test("announcements become PINNED pengumuman keeping author, body and creation time", async () => {
  const { t, fx, legacy } = await fixture();
  const source = await t.run(async (ctx) => ctx.db.get(legacy.announcementId));
  await runToCompletion(t);

  const post = byTitle(await posts(t), "Kelas baru dibuka");
  expect(post.kind).toBe("pengumuman");
  expect(post.pinned).toBe(true);
  expect(post.authorId).toBe(fx.instructorId);
  expect(post.bodyMd).toBe("Pendaftaran mulai Senin.");
  expect(post.tenantId).toBe(fx.tenantId);
  expect(post.likeCount).toBe(0);
  expect(post.commentCount).toBe(0);
  // The migrated feed must NOT be timestamped "now".
  expect(post.lastActivityAt).toBe(source!._creationTime);
});

test("approved AND pending resources migrate; rejected ones are skipped (#33)", async () => {
  const { t } = await fixture();
  await runToCompletion(t);
  const rows = await posts(t);

  const approved = byTitle(rows, "Panduan Prompt");
  expect(approved.kind).toBe("sumber");
  expect(approved.linkUrl).toBe("https://contoh.id/panduan");
  expect(approved.bodyMd).toBe("Bagus untuk pemula.");
  expect(approved.pinned).toBe(false);

  // The gate is gone — a member's queued submission simply appears.
  const pending = byTitle(rows, "Menunggu Kurator");
  expect(pending.kind).toBe("sumber");
  expect(pending.bodyMd).toBe(""); // note absent → empty body, not undefined

  // A curator's explicit NO is not resurrected into a public feed.
  expect(rows.some((p) => p.title === "Ditolak Kurator")).toBe(false);
});

test("suggestions migrate regardless of status; the status wording is dropped", async () => {
  const { t, fx } = await fixture();
  await runToCompletion(t);
  const post = byTitle(await posts(t), "Usul kelas RAG");
  expect(post.kind).toBe("usulan");
  expect(post.authorId).toBe(fx.memberId);
  expect(post.bodyMd).toBe("Materi retrieval augmented generation.");
  expect(JSON.stringify(post)).not.toContain("planned");
});

test("votes become likes: likeCount and the AUTHOR's points reflect history", async () => {
  const { t, fx } = await fixture();
  await runToCompletion(t);

  const post = byTitle(await posts(t), "Usul kelas RAG");
  expect(post.likeCount).toBe(2); // owner's vote + the author's own vote

  const likes = await t.run(async (ctx) =>
    ctx.db
      .query("postLikes")
      .withIndex("by_post", (q) => q.eq("postId", post._id))
      .collect()
  );
  expect(likes).toHaveLength(2);
  expect(new Set(likes.map((l) => l.userId))).toEqual(new Set([fx.ownerId, fx.memberId]));
  expect(likes.every((l) => l.tenantId === fx.tenantId)).toBe(true);

  // Leaderboard starts from history, not zero — but a self-vote never scores.
  const points = await t.run(async (ctx) => {
    const m = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", fx.tenantId).eq("userId", fx.memberId)
      )
      .unique();
    return m?.points ?? null;
  });
  expect(points).toBe(1);
});

test("IDEMPOTENT — a second full run inserts nothing and double-counts nothing", async () => {
  const { t, fx } = await fixture();
  await runToCompletion(t);
  const first = await posts(t);
  // 1 announcement + 2 migrating resources + 1 suggestion = 4 posts; the
  // rejected resource is the one that must NOT be here.
  expect(first).toHaveLength(4);
  expect(first.map((p) => p.title).sort()).toEqual(
    ["Kelas baru dibuka", "Menunggu Kurator", "Panduan Prompt", "Usul kelas RAG"].sort()
  );

  await runToCompletion(t);
  const second = await posts(t);
  expect(second).toHaveLength(first.length);
  expect(byTitle(second, "Usul kelas RAG").likeCount).toBe(2); // not 4
  const points = await t.run(async (ctx) => {
    const m = await ctx.db
      .query("memberships")
      .withIndex("by_tenant_user", (q) =>
        q.eq("tenantId", fx.tenantId).eq("userId", fx.memberId)
      )
      .unique();
    return m?.points ?? null;
  });
  expect(points).toBe(1); // not 2
});

test("`remaining` is the drop-the-tables gate: non-zero before, zero after", async () => {
  const { t } = await fixture();
  const before: RemainingResult = await t.query(remainingRef, {});
  expect(before.announcements).toBe(1);
  expect(before.resources).toBe(2); // rejected counted separately, never as work
  expect(before.rejectedResources).toBe(1);
  expect(before.suggestions).toBe(1);
  expect(before.votes).toBe(2);
  expect(before.atLeast).toBe(false);

  await runToCompletion(t);

  const after: RemainingResult = await t.query(remainingRef, {});
  expect(after).toEqual({
    announcements: 0,
    resources: 0,
    rejectedResources: 1, // unmigrated BY DESIGN — not outstanding work
    suggestions: 0,
    votes: 0,
    atLeast: false,
  });
});

test("a dangling vote (its suggestion is gone) never blocks the run", async () => {
  const { t, fx } = await fixture();
  await t.run(async (ctx) => {
    // Real row first — the id validator rejects a synthetic one — then delete
    // the suggestion out from under the vote.
    const orphanTarget = await ctx.db.insert("suggestions", {
      tenantId: fx.tenantId,
      title: "Usulan yang lenyap",
      submittedBy: fx.memberId,
      status: "open",
    });
    await ctx.db.insert("suggestionVotes", {
      tenantId: fx.tenantId,
      suggestionId: orphanTarget,
      userId: fx.ownerId,
    });
    await ctx.db.delete(orphanTarget);
  });
  await runToCompletion(t);
  expect(await posts(t)).toHaveLength(4);
});

test("replay stays safe past the old 200-post scan window", async () => {
  // Regression: the key probe used to be a bounded .take(200) over by_author,
  // so once an author held 200 posts the migrated row fell outside the window,
  // findMigratedPost returned null forever, and a second run double-inserted
  // everything. It is an exact by_author_kind_title hit now.
  const t = setup();
  const fx = await seedTenantFixture(t);
  await t.run(async (ctx) => {
    for (let i = 0; i < 205; i++) {
      await ctx.db.insert("posts", {
        tenantId: fx.tenantId,
        authorId: fx.ownerId,
        kind: "diskusi",
        title: `Bising ${i}`,
        bodyMd: "…",
        pinned: false,
        lastActivityAt: 1_700_000_000_000 + i,
        likeCount: 0,
        commentCount: 0,
      });
    }
    await ctx.db.insert("announcements", {
      tenantId: fx.tenantId,
      title: "Pengumuman lawas",
      bodyMd: "Isi pengumuman.",
      createdBy: fx.ownerId,
      postedToDiscord: false,
    });
  });

  const countMigrated = async () =>
    (await t.run((ctx) => ctx.db.query("posts").collect())).filter(
      (p) => p.title === "Pengumuman lawas"
    ).length;

  await t.mutation(backfillRunRef, {});
  expect(await countMigrated()).toBe(1);
  await t.mutation(backfillRunRef, {});
  expect(await countMigrated()).toBe(1);
});
