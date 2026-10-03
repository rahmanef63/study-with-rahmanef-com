import { paginationOptsValidator } from "convex/server";
import { v, ConvexError } from "convex/values";
import { query, type QueryCtx } from "../../_generated/server";
import type { Id } from "../../_generated/dataModel";
import { requirePlatformAdmin } from "../../_shared/auth";
import { userDetail, userList } from "./contract";
import { loadUserSources, summarizeUser } from "./read";
import { buildUserDetail } from "./detail";
import type { UserRow } from "./contract";

type ListArgs = { paginationOpts: { numItems: number; cursor: string | null }; search?: string };
export const listUsersHandler = async (ctx: QueryCtx, args: ListArgs) => {
  await requirePlatformAdmin(ctx);
  if (!Number.isInteger(args.paginationOpts.numItems) || args.paginationOpts.numItems < 1
    || args.paginationOpts.numItems > 20 || (args.search?.length ?? 0) > 100) {
    throw new ConvexError({ code: "VALIDATION_FAILED", message: "Batas daftar tidak valid" });
  }
  const page = await ctx.db.query("users").withIndex("by_creation_time").order("desc")
    .paginate({ ...args.paginationOpts, maximumRowsRead: 20, maximumBytesRead: 1_048_576 });
  const rows: UserRow[] = [];
  const budget = { bytes: 0, rows: 0 };
  for (const user of page.page) rows.push(await summarizeUser(ctx, user, await loadUserSources(ctx, user._id, false, budget)));
  const search = args.search?.trim().toLocaleLowerCase("id") ?? "";
  return {
    page: search ? rows.filter(row => [row.displayName, row.username, row.email].some(value => value?.toLocaleLowerCase("id").includes(search))) : rows,
    isDone: page.isDone, continueCursor: page.continueCursor,
    ...(page.splitCursor !== undefined ? { splitCursor: page.splitCursor } : {}),
    ...(page.pageStatus !== undefined ? { pageStatus: page.pageStatus } : {}),
    searchAppliedToPage: true as const,
  };
};

export const getUserDetailHandler = async (ctx: QueryCtx, args: { userId: Id<"users"> }) => {
  await requirePlatformAdmin(ctx);
  const user = await ctx.db.get(args.userId);
  if (!user) throw new ConvexError({ code: "NOT_FOUND", message: "Pengguna tidak ditemukan" });
  const sources = await loadUserSources(ctx, user._id, true);
  return buildUserDetail(ctx, user, sources);
};

export const listUsers = query({ args: { paginationOpts: paginationOptsValidator, search: v.optional(v.string()) }, returns: userList, handler: listUsersHandler });
export const getUserDetail = query({ args: { userId: v.id("users") }, returns: userDetail, handler: getUserDetailHandler });
