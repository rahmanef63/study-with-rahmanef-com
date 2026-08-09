// One-shot backfill: the three retired boards → the Diskusi feed (v1.8 #33).
//
//   announcements  → posts(kind "pengumuman", pinned)
//   resources      → posts(kind "sumber",     linkUrl)   [rejected rows skipped]
//   suggestions    → posts(kind "usulan")
//   suggestionVotes→ postLikes + likeCount + memberships.points
//
// Modelled on the retired convex/features/pageviews/purge.ts: batched,
// self-rescheduling, internalMutation so no client can call it, with a
// verification internalQuery the integrator asserts before dropping tables.
//
//   npx convex run --prod features/posts/backfill:run
//   npx convex run --prod features/posts/backfill:remaining
//
// The source tables are NEVER written or deleted here. Dropping them is a
// separate integrator commit, gated on `remaining` reporting zeros.
//
// ─────────────────────────────────────────────────────────────────────────────
// IDEMPOTENCY STRATEGY — existence check on (tenantId, authorId, kind, title),
// NOT a stored cursor.
//
// A cursor alone cannot satisfy "running it twice must not double-insert": a
// second run started from the beginning (operator re-runs the command, or a
// scheduled continuation is lost and someone restarts it) would re-insert
// everything, and the source tables carry no "migrated" flag to fall back on.
// The key probe makes every insert conditional on the destination, so the
// backfill is safe to replay from scratch at any point. The `_creationTime`
// cursor below is therefore ONLY a batching device — it keeps each transaction
// inside Convex's document budget and preserves source ordering — never the
// correctness guarantee.
//
// Accepted cost of the key: two legacy rows sharing (tenant, author, kind,
// title) collapse into one post, and a hand-written post matching a legacy
// row's key suppresses that row. Both are duplicate titles by the same author
// in the same community — the right outcome for a feed either way.
import { v } from "convex/values";
import { internalMutation, internalQuery } from "../../_generated/server";
import type { MutationCtx } from "../../_generated/server";
import {
  announcementKey,
  findMigratedPost,
  migrateAnnouncement,
  migrateResource,
  migrateSuggestion,
  resourceKey,
  suggestionKey,
} from "./backfillMap";
import { likeForVote, migrateVote, postForVote } from "./backfillVotes";
import { BACKFILL_PHASES, backfillRunRef, type BackfillPhase } from "./refs";

/** Source rows per transaction. Each row costs ONE exact index hit
 *  (by_author_kind_title), so the batch is O(BATCH), not O(BATCH x scan). */
export const BATCH = 100;

type PhaseResult = { processed: number; migrated: number; cursor: number };

/** Run `migrate` over one batch and report progress + the resumption cursor. */
async function step<R extends { _creationTime: number }>(
  rows: R[],
  cursor: number,
  migrate: (row: R) => Promise<boolean>
): Promise<PhaseResult> {
  let migrated = 0;
  for (const row of rows) if (await migrate(row)) migrated++;
  return { processed: rows.length, migrated, cursor: rows.at(-1)?._creationTime ?? cursor };
}

/**
 * One batch of one phase. Every Convex table carries the built-in
 * `by_creation_time` index, so each read is an index RANGE — not a scan —
 * resuming where the previous batch stopped. Written out per table because
 * `ctx.db.query(T)` does not narrow `Doc<T>` through a type parameter.
 */
async function runPhase(
  ctx: MutationCtx,
  phase: BackfillPhase,
  cursor: number
): Promise<PhaseResult> {
  const range = <Q extends { gt: (f: "_creationTime", v: number) => R }, R>(q: Q): R =>
    q.gt("_creationTime", cursor);
  switch (phase) {
    case "announcements": {
      const rows = await ctx.db.query("announcements").withIndex("by_creation_time", range).take(BATCH);
      return step(rows, cursor, (row) => migrateAnnouncement(ctx, row));
    }
    case "resources": {
      const rows = await ctx.db.query("resources").withIndex("by_creation_time", range).take(BATCH);
      return step(rows, cursor, (row) => migrateResource(ctx, row));
    }
    case "suggestions": {
      const rows = await ctx.db.query("suggestions").withIndex("by_creation_time", range).take(BATCH);
      return step(rows, cursor, (row) => migrateSuggestion(ctx, row));
    }
    case "votes": {
      // LAST on purpose: a vote can only attach to an already-migrated usulan.
      const rows = await ctx.db.query("suggestionVotes").withIndex("by_creation_time", range).take(BATCH);
      return step(rows, cursor, (row) => migrateVote(ctx, row));
    }
  }
}

/**
 * Migrate one batch, then re-schedule itself — for the next batch of the same
 * phase, or for the first batch of the next phase once this one is drained.
 * Callable with no args; the phase/cursor pair exists for the self-scheduling
 * chain and for resuming a run by hand.
 */
export const run = internalMutation({
  args: {
    phase: v.optional(
      v.union(
        v.literal("announcements"),
        v.literal("resources"),
        v.literal("suggestions"),
        v.literal("votes")
      )
    ),
    cursor: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const phase = args.phase ?? BACKFILL_PHASES[0];
    const cursor = args.cursor ?? 0;
    const result = await runPhase(ctx, phase, cursor);

    const phaseDone = result.processed < BATCH;
    const next = phaseDone ? BACKFILL_PHASES[BACKFILL_PHASES.indexOf(phase) + 1] : phase;
    if (next !== undefined) {
      await ctx.scheduler.runAfter(0, backfillRunRef, {
        phase: next,
        cursor: phaseDone ? 0 : result.cursor,
      });
    }

    return {
      phase,
      processed: result.processed,
      migrated: result.migrated,
      nextPhase: next ?? null,
      done: next === undefined,
    };
  },
});

/**
 * Verification gate — how many rows of each source table are STILL unmigrated.
 * Must report zeros before the integrator drops the tables. Bounded reads
 * (`probe`), not a full count: `atLeast` is true when a probe saturated, which
 * means "run me again with a bigger probe", never "you are done".
 *
 * `rejectedResources` is reported separately: those rows are unmigrated BY
 * DESIGN (see migrateResource) and must not be read as outstanding work.
 */
export const remaining = internalQuery({
  args: { probe: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const n = args.probe ?? 1000;
    let announcements = 0;
    let resources = 0;
    let rejectedResources = 0;
    let suggestions = 0;
    let votes = 0;

    const annRows = await ctx.db.query("announcements").take(n);
    for (const row of annRows) {
      if ((await findMigratedPost(ctx, announcementKey(row))) === null) announcements++;
    }

    const resRows = await ctx.db.query("resources").take(n);
    for (const row of resRows) {
      if (row.status === "rejected") rejectedResources++;
      else if ((await findMigratedPost(ctx, resourceKey(row))) === null) resources++;
    }

    const sugRows = await ctx.db.query("suggestions").take(n);
    for (const row of sugRows) {
      if ((await findMigratedPost(ctx, suggestionKey(row))) === null) suggestions++;
    }

    const voteRows = await ctx.db.query("suggestionVotes").take(n);
    for (const row of voteRows) {
      const post = await postForVote(ctx, row);
      if (post === null || (await likeForVote(ctx, post._id, row.userId)) === null) votes++;
    }

    return {
      announcements,
      resources,
      rejectedResources,
      suggestions,
      votes,
      /** A probe saturated — the counts above are a lower bound, re-probe. */
      atLeast:
        annRows.length === n ||
        resRows.length === n ||
        sugRows.length === n ||
        voteRows.length === n,
    };
  },
});
