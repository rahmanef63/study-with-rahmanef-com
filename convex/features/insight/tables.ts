// insight feature — OWNED TABLES. Spread into convex/schema.ts via
// `...insightTables` (precedent: the retired features/pageviews/tables.ts).
//
// WHAT THIS REPLACES, AND WHY IT IS SHAPED DIFFERENTLY. The old `pageviews`
// table stored ONE ROW PER VISIT from an anonymous beacon, plus a companion
// rate-limit table to keep that write surface from being abused. It was dropped
// (commit 55ed950) as an unbounded mess that still could not answer the only
// question worth asking. This model answers exactly that question and nothing
// more:
//
//   "which materi do people actually read, and where do they stop?"
//
// Three deliberate differences from the thing it replaces:
//  1. ONE ROW PER MEMBER PER MATERI PER DAY, not per visit. Re-reading the same
//     page ten times in an afternoon is one row, so the table grows with
//     LEARNING, not with scrolling.
//  2. MEMBER-ONLY writes. Membership IS the rate limit — you cannot write a row
//     without a membership row in the materi's tenant, and you cannot write
//     more than one per materi per day. That is why there is no rate-limit
//     table this time.
//  3. A ROLL-UP PATCHED IN THE SAME MUTATION, so every read is O(1) per materi
//     instead of a scan over history.
//
// THE COVERAGE THIS DOES NOT HAVE, stated plainly rather than buried: ANONYMOUS
// READS ARE NEVER COUNTED. Every public etalase visit, every search-engine
// arrival, every logged-out person reading a shared permalink is invisible
// here. These numbers describe MEMBERS ONLY. Treat them as "what our community
// reads", never as traffic.
import { defineTable } from "convex/server";
import { v } from "convex/values";

export const insightTables = {
  /**
   * One row per (member, materi, day). The `day` is computed SERVER-SIDE in
   * Asia/Jakarta (see ./day.ts) and never accepted from the client — a
   * client-chosen day would hand back the unlimited write surface that the
   * per-day key exists to remove.
   *
   * `by_lesson_user_day` carries the whole write path: the exact triple is the
   * idempotency probe, and its `[lessonId, userId]` PREFIX answers "has this
   * member ever opened this materi before?" — which is what keeps the distinct
   * viewer count in the roll-up exact without a second index.
   *
   * `by_tenant_day` is a lexicographic range over "YYYY-MM-DD", which is how
   * "active learners this week" stays one bounded scan.
   */
  materiViews: defineTable({
    tenantId: v.id("tenants"),
    lessonId: v.id("lessons"),
    userId: v.id("users"),
    /** "YYYY-MM-DD" in Asia/Jakarta (UTC+7, no DST). Server-computed. */
    day: v.string(),
  })
    .index("by_lesson_user_day", ["lessonId", "userId", "day"])
    .index("by_tenant_day", ["tenantId", "day"]),

  /**
   * Per-materi roll-up, patched inside the same mutation that inserts the view.
   * Stored rather than derived on purpose, and it is the ONE place in this
   * feature where that trade is made: deriving it would mean scanning the
   * history of every materi on every dashboard render, which is precisely the
   * O(rows) read that made the old pageviews table useless.
   *
   * `views` and `viewers` are DIFFERENT NUMBERS and the difference is the point:
   *  · `views`   = member-days. Ten people once, or one person ten days apart.
   *  · `viewers` = DISTINCT members who ever opened it. This is the funnel's
   *                numerator; a drop-off chart built on `views` would show one
   *                obsessive re-reader as ten people.
   */
  materiViewCounts: defineTable({
    tenantId: v.id("tenants"),
    lessonId: v.id("lessons"),
    /** Total member-days (sum of materiViews rows for this materi). */
    views: v.number(),
    /** Distinct members who have opened this materi at least once. */
    viewers: v.number(),
    lastViewedAt: v.number(),
  }).index("by_tenant_lesson", ["tenantId", "lessonId"]),

  /**
   * The assessment's RESULT, for someone who was already logged in when they
   * finished it. The questionnaire itself is a pure client-side function and
   * MUST keep working with no account at all — this table only exists so the
   * home page can greet a returning member with the plan they already got.
   * Never gate the assessment on a row here existing.
   *
   * ONE ROW PER USER (`by_user`, upserted). Not per (user, tenant): a person has
   * one current plan, and keeping a second row per community would mean the
   * home page has to guess which one to greet them with. `tenantId` is optional
   * PROVENANCE — "which community they were looking at when they answered".
   */
  learnerProfiles: defineTable({
    userId: v.id("users"),
    tenantId: v.optional(v.id("tenants")),
    /** Raw multiple-choice answers, kept so a re-scored plan can be explained. */
    answers: v.array(v.object({ questionId: v.string(), optionId: v.string() })),
    level: v.union(v.literal("pemula"), v.literal("menengah"), v.literal("mahir")),
    /** Recommended learning paths, in order. Slugs, not titles — titles drift. */
    pathSlugs: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_user", ["userId"]),
};
