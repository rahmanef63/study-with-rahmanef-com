// profiles — PUBLIC etalase surface (STATUS #9, v1.1). Powers /u/[username]
// and the badge wall for signed-out visitors (PRD R11).
//
// ANONYMOUS ETALASE WHITELIST (AGENTS.md §6) — publicGetByUsername,
// publicListBadges. These two queries are the ONLY anonymous surface of this
// slice. Each one qualifies for the exception because ALL of the following hold:
//   1. name starts with `public` (auditable) AND is listed here;
//   2. it returns an EXPLICIT safe projection (types PublicProfile / Badge) —
//      never a raw doc, never userId / isPlatformAdmin / _id, never drafts;
//   3. badges read only PUBLISHED courses of ACTIVE tenants, via indexes.
// Everything else in this feature (queries.ts / mutations.ts) stays authed with
// requireUser as its first handler line. Mutations NEVER qualify (§6).
//
// Reading the shared `courseCompletions` / `courses` / `tenants` tables directly
// is sanctioned (precedent: the progress feature; table access ≠ code import —
// AGENTS.md §4). Course title/slug and tenant slug are public per the
// docs/DATA-MODEL.md access table ("courseCompletions publik via profil").
import { ConvexError, v } from "convex/values";
import type { Doc } from "../../_generated/dataModel";
import { query, type QueryCtx } from "../../_generated/server";
import { normalizeUsername } from "./username";
import { BADGE_TAKE, type Badge, type PublicProfile } from "./types";

/** NOT_FOUND for an unknown/renamed handle — no internals in the message. */
function notFound(): never {
  throw new ConvexError({ code: "NOT_FOUND", message: "Profil tidak ditemukan" });
}

/** Explicit safe projection — optionals → null so the key set stays stable. */
function toPublicProfile(profile: Doc<"profiles">): PublicProfile {
  return {
    username: profile.username,
    displayName: profile.displayName,
    bio: profile.bio ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    // userId, isPlatformAdmin, _id, _creationTime intentionally omitted (P0 §6).
  };
}

/** Resolve a URL handle to its profile row, normalizing to the canonical form. */
async function profileByHandle(
  ctx: QueryCtx,
  handle: string
): Promise<Doc<"profiles">> {
  const profile = await ctx.db
    .query("profiles")
    .withIndex("by_username", (q) => q.eq("username", normalizeUsername(handle)))
    .unique();
  if (profile === null) notFound();
  return profile;
}

/**
 * Public profile card for /u/[username] — ANONYMOUS (etalase, §6). Returns the
 * safe projection only. Unknown handle → NOT_FOUND (no existence oracle beyond
 * "this public handle has no page", which is inherent to a public profile URL).
 */
export const publicGetByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args): Promise<PublicProfile> => {
    const profile = await profileByHandle(ctx, args.username);
    return toPublicProfile(profile);
  },
});

/**
 * Public badge wall for /u/[username] — ANONYMOUS (etalase, §6). One badge per
 * courseCompletion, joined to its course + tenant. Only PUBLISHED courses of
 * ACTIVE tenants surface: drafts are never leaked (P0 §6) and suspended/pending
 * tenants stay private. Newest first.
 * TODO(rr): confirm — published-only (archived hidden) to honor §6
 * "exclusively active/published rows … never drafts" and match the courses
 * etalase; revisit if the product wants earned badges to persist after archive.
 */
export const publicListBadges = query({
  args: { username: v.string() },
  handler: async (ctx, args): Promise<Badge[]> => {
    const profile = await profileByHandle(ctx, args.username);

    const completions = await ctx.db
      .query("courseCompletions")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .take(BADGE_TAKE);

    const badges: Badge[] = [];
    for (const completion of completions) {
      const course = await ctx.db.get(completion.courseId);
      if (course === null || course.status !== "published") continue; // never leak drafts/archived
      const tenant = await ctx.db.get(course.tenantId);
      if (tenant === null || tenant.status !== "active") continue; // suspended/pending stay private
      badges.push({
        courseTitle: course.title,
        courseSlug: course.slug,
        tenantSlug: tenant.slug,
        earnedAt: completion._creationTime,
      });
    }

    badges.sort((a, b) => b.earnedAt - a.earnedAt); // newest earned first
    return badges;
  },
});
