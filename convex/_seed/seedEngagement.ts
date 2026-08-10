// seed:seedEngagement — community life for the flagship so nothing lands
// empty: starter members, a Diskusi feed across all four post kinds with the
// likes that score the Peringkat board, and starter lesson threads. Idempotent:
// members by email, posts by (tenant, kind, title), comments by
// (lesson + author + body), likes by (post + user).
import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";
import { likeSeedPost, upsertSeedPost } from "./posts";
import {
  SEED_MEMBERS,
  SEED_RESOURCES,
  SEED_THREADS,
  SEED_USULAN,
} from "./engagementData";
import type { SeedFeedPost } from "./types";

/** Bound on the comment idempotency probe (see the call site). */
const SEED_THREAD_SCAN = 200;

export type SeedEngagementArgs = { ownerEmail: string; tenantSlug: string };

export async function runSeedEngagement(ctx: MutationCtx, args: SeedEngagementArgs) {
  const owner = await ctx.db
    .query("users")
    .withIndex("email", (q) => q.eq("email", args.ownerEmail))
    .unique();
  if (owner === null) throw new Error(`No user with email ${args.ownerEmail} — run seed:bootstrap first.`);
  const tenant = await ctx.db
    .query("tenants")
    .withIndex("by_slug", (q) => q.eq("slug", args.tenantSlug))
    .unique();
  if (tenant === null) throw new Error(`No tenant "${args.tenantSlug}" — run seed:bootstrap first.`);
  const tenantId = tenant._id;
  const made = { members: 0, memberships: 0, sumber: 0, comments: 0, usulan: 0, likes: 0, skipped: 0 };

  // 1. members (idempotent by email) → author username map, seeded with owner.
  // Each also joins the tenant as `member` so the roster/count reflects them.
  const byUsername: Record<string, Id<"users">> = { rahman: owner._id };
  for (const m of SEED_MEMBERS) {
    let u = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", m.email)).unique();
    if (u === null) {
      const uid = await ctx.db.insert("users", { email: m.email, name: m.displayName });
      await ctx.db.insert("profiles", { userId: uid, username: m.username, displayName: m.displayName, bio: m.bio });
      u = await ctx.db.get(uid);
      made.members++;
    }
    if (u) {
      byUsername[m.username] = u._id;
      const membership = await ctx.db
        .query("memberships")
        .withIndex("by_tenant_user", (q) => q.eq("tenantId", tenantId).eq("userId", u!._id))
        .unique();
      if (membership === null) {
        await ctx.db.insert("memberships", { tenantId, userId: u._id, role: "member" });
        made.memberships++;
      }
    }
  }
  const resolve = (username: string): Id<"users"> | null => byUsername[username] ?? null;

  // course slug → { courseId, firstLessonId }. The first materi is the first
  // PLACEMENT: `courseLessons.by_course` is ["courseId","order"], so the index
  // range is already the syllabus order and `.first()` is the opening materi —
  // no module walk, no client-side sort (DECISIONS #37).
  async function courseCtx(slug: string) {
    const course = await ctx.db
      .query("courses")
      .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", slug))
      .unique();
    if (course === null) return null;
    const first = await ctx.db
      .query("courseLessons")
      .withIndex("by_course", (q) => q.eq("courseId", course._id))
      .first();
    return { courseId: course._id, firstLessonId: first?.lessonId ?? (null as Id<"lessons"> | null) };
  }
  const courseCache = new Map<string, Awaited<ReturnType<typeof courseCtx>>>();
  const getCourse = async (slug: string) => {
    if (!courseCache.has(slug)) courseCache.set(slug, await courseCtx(slug));
    return courseCache.get(slug) ?? null;
  };

  // 2. sumber belajar — owner-curated posts(kind "sumber") with the link in
  // `linkUrl`. Staggered lastActivityAt so the seeded feed reads as a feed
  // and not as one instant where everything happened at once.
  const now = Date.now();
  let seq = 0;
  const stagger = () => now - seq++ * 60_000;
  for (const r of SEED_RESOURCES) {
    const post = await upsertSeedPost(ctx, {
      tenantId, authorId: owner._id, kind: "sumber",
      title: r.title, bodyMd: r.note ?? "", linkUrl: r.url, lastActivityAt: stagger(),
    });
    if (post.created) made.sumber++;
    else made.skipped++;
  }

  // 3. comments — starter discussion on each course's first lesson (idempotent
  // by lesson+author+body; depth-1: reply.parentId = root).
  for (const t of SEED_THREADS) {
    const cc = await getCourse(t.courseSlug);
    if (!cc?.firstLessonId) { made.skipped++; continue; }
    const lessonId = cc.firstLessonId;
    const rootAuthor = resolve(t.root.author);
    if (!rootAuthor) { made.skipped++; continue; }
    // Bounded (P0: no unbounded read). A seeded materi's thread is a handful of
    // rows; past this many real comments the seed simply stops recognising its
    // own and is a no-op, which is the safe direction.
    const existing = await ctx.db
      .query("comments")
      .withIndex("by_lesson", (q) => q.eq("lessonId", lessonId))
      .take(SEED_THREAD_SCAN);
    let rootId = existing.find((c) => c.userId === rootAuthor && c.bodyMd === t.root.bodyMd)?._id ?? null;
    if (rootId === null) {
      rootId = await ctx.db.insert("comments", { tenantId, lessonId, userId: rootAuthor, bodyMd: t.root.bodyMd });
      made.comments++;
    }
    if (t.reply) {
      const replyAuthor = resolve(t.reply.author);
      if (replyAuthor && !existing.some((c) => c.userId === replyAuthor && c.bodyMd === t.reply!.bodyMd)) {
        await ctx.db.insert("comments", { tenantId, lessonId, userId: replyAuthor, bodyMd: t.reply.bodyMd, parentId: rootId });
        made.comments++;
      }
    }
  }

  // 4. usulan + obrolan, with their likes. A like is what feeds the Peringkat
  // board, so seeding it through likeSeedPost (row + likeCount + the author's
  // points, one transaction) is what makes the leaderboard non-empty too.
  // Only "usulan" is seeded now: "diskusi" is where real members talk, and
  // seeding it meant inventing conversation (see engagementData.ts).
  const feed: { kind: "usulan"; rows: SeedFeedPost[] }[] = [
    { kind: "usulan", rows: SEED_USULAN },
  ];
  for (const { kind, rows } of feed) {
    for (const p of rows) {
      const authorId = resolve(p.author);
      if (!authorId) { made.skipped++; continue; }
      const post = await upsertSeedPost(ctx, {
        tenantId, authorId, kind, title: p.title, bodyMd: p.bodyMd, lastActivityAt: stagger(),
      });
      if (post.created) made[kind]++;
      for (const liker of p.likedBy) {
        const uid = resolve(liker);
        if (uid && (await likeSeedPost(ctx, post.postId, uid))) made.likes++;
      }
    }
  }

  return { note: "engagement seed complete (idempotent)", ...made };
}
