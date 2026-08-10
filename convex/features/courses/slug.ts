// courses feature — per-tenant materi slug generation.
// A materi's slug is its canonical URL segment (/k/<tenant>/materi/<slug>) and
// how one materi references another, so it must be unique WITHIN THE TENANT.
// Shared by createLesson/updateLesson and the one-shot materiBackfill.
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";

type Ctx = QueryCtx | MutationCtx;

/** kebab-case handle from a title. Not unique on its own — see uniqueSlug. */
export function baseSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return slug === "" ? "materi" : slug;
}

/** Is this slug free in the tenant? `exceptLessonId` lets a materi keep its own. */
export async function isSlugFree(
  ctx: Ctx,
  tenantId: Id<"tenants">,
  slug: string,
  exceptLessonId?: Id<"lessons">
): Promise<boolean> {
  const clash = await ctx.db
    .query("lessons")
    .withIndex("by_tenant_slug", (q) => q.eq("tenantId", tenantId).eq("slug", slug))
    .first();
  return clash === null || clash._id === exceptLessonId;
}

/**
 * First free `slug`, `slug-2`, `slug-3`… within the tenant. Bounded: a title
 * colliding more than 50 times in one community is not a real scenario, and an
 * unbounded loop in a mutation is worse than a suffix that looks odd.
 */
export async function uniqueSlug(
  ctx: MutationCtx,
  tenantId: Id<"tenants">,
  title: string
): Promise<string> {
  const base = baseSlug(title);
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    if (await isSlugFree(ctx, tenantId, candidate)) return candidate;
  }
  return `${base}-${Date.now()}`;
}
