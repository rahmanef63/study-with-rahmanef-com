// insight feature — the counting core. Two kinds of number live here and the
// distinction matters when reading any dashboard built on them:
//
//  · READS come from `materiViewCounts`, a roll-up STORED at write time. It is
//    the one place this feature stores instead of derives, because the
//    alternative — scanning a materi's whole view history on every render — is
//    exactly the O(rows) read that made the old pageviews table worthless.
//  · COMPLETIONS are DERIVED on read from `lessonCompletions`, never stored
//    (DATA-MODEL "Derivasi & invarian"). Nothing here writes them.
//
// Outputs carry NO user identifiers — counts and titles only — so nothing
// PII-shaped can leak past the instructor gate.
import type { Doc, Id } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";
import {
  MAX_COMPLETIONS_PER_USER_SCAN,
  MAX_MEMBERSHIPS_SCAN,
  MAX_VIEW_COUNT_ROWS_SCAN,
  MAX_WEEK_VIEW_ROWS_SCAN,
} from "./constants";

/** The two view numbers for one materi. Absent roll-up row → all zeros. */
export type ViewTally = { views: number; viewers: number; lastViewedAt: number | null };

export const EMPTY_TALLY: ViewTally = { views: 0, viewers: 0, lastViewedAt: null };

/** All memberships of a tenant (every role), bounded. Length = member count. */
export async function listTenantMemberships(
  ctx: QueryCtx,
  tenantId: Id<"tenants">
): Promise<Doc<"memberships">[]> {
  return await ctx.db
    .query("memberships")
    .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
    .take(MAX_MEMBERSHIPS_SCAN);
}

/**
 * lessonId → view tally for one tenant, read in a SINGLE indexed scan.
 * Materi nobody has opened have no roll-up row at all and are simply absent —
 * callers must treat "missing" as zero, never as "no data". That absence is the
 * most interesting signal this feature produces, so it is never silently
 * dropped: pulse.ts folds the tenant's full materi list back in.
 */
export async function tallyByLesson(
  ctx: QueryCtx,
  tenantId: Id<"tenants">
): Promise<Map<Id<"lessons">, ViewTally>> {
  const rows = await ctx.db
    .query("materiViewCounts")
    .withIndex("by_tenant_lesson", (q) => q.eq("tenantId", tenantId))
    .take(MAX_VIEW_COUNT_ROWS_SCAN);
  return new Map(
    rows.map((row) => [
      row.lessonId,
      { views: row.views, viewers: row.viewers, lastViewedAt: row.lastViewedAt },
    ])
  );
}

/**
 * Distinct members who opened ANY materi in `[from, to]` (day keys, inclusive).
 * A lexicographic range over `by_tenant_day` — see ./day.ts for why the key is
 * a string. Counts PEOPLE, not rows: someone who read six materi today is one
 * active learner.
 */
export async function countActiveLearners(
  ctx: QueryCtx,
  tenantId: Id<"tenants">,
  from: string,
  to: string
): Promise<number> {
  const rows = await ctx.db
    .query("materiViews")
    .withIndex("by_tenant_day", (q) => q.eq("tenantId", tenantId).gte("day", from).lte("day", to))
    .take(MAX_WEEK_VIEW_ROWS_SCAN);
  return new Set(rows.map((row) => row.userId)).size;
}

/**
 * lessonId → how many CURRENT members completed it, restricted to `lessonIds`.
 *
 * Derived per member via `lessonCompletions.by_user`. It cannot go through the
 * completion's own `courseId`: that column is optional PROVENANCE now, empty
 * whenever a materi is taught in more than one course (DECISIONS #36). Each
 * member is counted AT MOST ONCE per materi, so a duplicate legacy row cannot
 * inflate a bar past the number of people who exist.
 *
 * KNOWN FLOOR: completions by users who have since LEFT the tenant are not
 * counted, because the roster is the membership list. Views have the same
 * blind spot from the other direction — a `materiViews` row survives the
 * membership that authorised it — so views and completions can disagree for a
 * departed member. At this platform's scale that is noise; it is documented
 * rather than corrected because correcting it means scanning ex-members.
 */
export async function countCompletionsPerLesson(
  ctx: QueryCtx,
  memberships: Doc<"memberships">[],
  lessonIds: Id<"lessons">[]
): Promise<Map<Id<"lessons">, number>> {
  const wanted = new Set<Id<"lessons">>(lessonIds);
  const counts = new Map<Id<"lessons">, number>();
  if (wanted.size === 0) return counts;
  for (const membership of memberships) {
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", membership.userId))
      .take(MAX_COMPLETIONS_PER_USER_SCAN);
    const seen = new Set<Id<"lessons">>();
    for (const completion of completions) {
      if (!wanted.has(completion.lessonId) || seen.has(completion.lessonId)) continue;
      seen.add(completion.lessonId);
      counts.set(completion.lessonId, (counts.get(completion.lessonId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Tenant-wide completion totals, all-time and since `sinceMs`, derived per
 * member. Scoped by the completion row's own `tenantId` so a member who also
 * learns in another community does not inflate this one.
 */
export async function countTenantCompletions(
  ctx: QueryCtx,
  memberships: Doc<"memberships">[],
  tenantId: Id<"tenants">,
  sinceMs: number
): Promise<{ total: number; recent: number }> {
  let total = 0;
  let recent = 0;
  for (const membership of memberships) {
    const completions = await ctx.db
      .query("lessonCompletions")
      .withIndex("by_user", (q) => q.eq("userId", membership.userId))
      .take(MAX_COMPLETIONS_PER_USER_SCAN);
    for (const completion of completions) {
      if (completion.tenantId !== tenantId) continue;
      total += 1;
      if (completion._creationTime >= sinceMs) recent += 1;
    }
  }
  return { total, recent };
}
