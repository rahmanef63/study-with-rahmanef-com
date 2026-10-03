import type { Doc, TableNames } from "../../_generated/dataModel";
import type { QueryCtx } from "../../_generated/server";

/** Shared budget bounds document count AND large lesson/comment body reads.
 * Indexed iteration stops immediately; unlike take(n), size cannot grow to n MiB.
 * One final document can cross the byte ceiling (Convex document max: 1 MiB).
 */
export const PLATFORM_READ_BYTES = 3 * 1024 * 1024;
export const PLATFORM_READ_ROWS = 10_000;
export const PLATFORM_SOURCE_ROWS = 2_000;
export type ReadBudget = { bytes: number; rows: number };
export type Source<T> = { rows: T[]; complete: boolean; rowsRead: number };

export async function readBounded<T>(
  iterable: AsyncIterable<T>, budget: ReadBudget, cap = PLATFORM_SOURCE_ROWS,
): Promise<Source<T>> {
  const rows: T[] = [];
  if (budget.bytes >= PLATFORM_READ_BYTES || budget.rows >= PLATFORM_READ_ROWS) {
    return { rows, complete: false, rowsRead: 0 };
  }
  let rowsRead = 0;
  for await (const row of iterable) {
    rowsRead++; budget.rows++;
    // 3 bytes per UTF-16 code unit conservatively bounds UTF-8 JSON size.
    budget.bytes += JSON.stringify(row).length * 3;
    if (rows.length >= cap || budget.bytes >= PLATFORM_READ_BYTES || budget.rows >= PLATFORM_READ_ROWS) {
      return { rows, complete: false, rowsRead };
    }
    rows.push(row);
  }
  return { rows, complete: true, rowsRead };
}

export async function loadPlatformSources(ctx: QueryCtx, fromDay: string, toDay: string, fromMs: number, toMs: number) {
  const budget: ReadBudget = { bytes: 0, rows: 0 };
  const inventory = <T extends TableNames>(table: T, cap = PLATFORM_SOURCE_ROWS) =>
    readBounded<Doc<T>>(ctx.db.query(table).withIndex("by_creation_time").order("desc"), budget, cap);

  const tenants = await inventory("tenants", 128);
  const users = await inventory("users", 3_000);
  const memberships = await inventory("memberships", 3_000);
  const courses = await inventory("courses", 512);
  const lessons = await inventory("lessons", 512);
  const quizzes = await inventory("quizzes", 256);
  const placements = await inventory("courseLessons");
  const views = await readBounded(ctx.db.query("materiViews")
    .withIndex("by_day", q => q.gte("day", fromDay).lte("day", toDay)), budget);
  const completions = await readBounded(ctx.db.query("lessonCompletions").withIndex("by_creation_time", q => q.gte("_creationTime", fromMs).lt("_creationTime", toMs)), budget);
  const badges = await readBounded(ctx.db.query("courseCompletions").withIndex("by_creation_time", q => q.gte("_creationTime", fromMs).lt("_creationTime", toMs)), budget);
  const attempts = await readBounded(ctx.db.query("quizAttempts").withIndex("by_creation_time", q => q.gte("_creationTime", fromMs).lt("_creationTime", toMs)), budget);
  const comments = await readBounded(ctx.db.query("comments").withIndex("by_creation_time", q => q.gte("_creationTime", fromMs).lt("_creationTime", toMs)), budget);
  const rollups = await inventory("materiViewCounts");
  const posts = await inventory("posts", 512);
  return { tenants, users, memberships, courses, lessons, quizzes, placements, views, completions, badges, attempts, comments, rollups, posts };
}
export type PlatformSources = Awaited<ReturnType<typeof loadPlatformSources>>;
