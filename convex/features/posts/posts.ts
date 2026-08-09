// posts feature — Diskusi write surface (v1.8 #29/#33). P0 contract per
// handler: v.* validators + authz helper on the FIRST line, auth BEFORE any
// by-ID read, tenantId ALWAYS from the tenant/post row (never re-read from args
// after the fact). Counters (`likeCount`/`commentCount`) are stored, so every
// writer that touches them patches in the SAME transaction (see likes.ts and
// features/comments/comments.ts).
import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { requireTenantRole } from "../../_shared/auth";
import {
  assertLive,
  requireAuthorOrInstructorForPost,
  requireInstructorForPost,
} from "./access";
import { assertUnderDailyPostLimit, countRecentPostsByUser } from "./antiSpam";
import { scheduleAnnouncementFanout } from "./notify";
import { postToDiscordRef } from "./refs";
import {
  assertBody,
  assertLinkUrl,
  assertTitle,
  assertYoutubeVideoId,
} from "./validate";

const kindValidator = v.union(
  v.literal("diskusi"),
  v.literal("pengumuman"),
  v.literal("usulan"),
  v.literal("sumber")
);

/** "" clears an optional field on edit; anything else is validated + trimmed. */
function optionalField(
  raw: string | undefined,
  assert: (value: string) => void
): { set: boolean; value: string | undefined } {
  if (raw === undefined) return { set: false, value: undefined };
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { set: true, value: undefined };
  assert(trimmed);
  return { set: true, value: trimmed };
}

/**
 * Member of the tenant creates a post. `kind: "pengumuman"` additionally
 * requires instructor+ (DATA-MODEL access table). Always lands unpinned;
 * pinning is a separate instructor-only action.
 * Anti-spam (MANDATORY, DECISIONS #33): RATE_LIMITED past the per-user daily
 * cap, with a stricter budget for posts carrying a linkUrl.
 */
export const create = mutation({
  args: {
    tenantId: v.id("tenants"),
    kind: kindValidator,
    title: v.string(),
    bodyMd: v.string(),
    linkUrl: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { userId } = await requireTenantRole(ctx, args.tenantId, "member");
    if (args.kind === "pengumuman") {
      await requireTenantRole(ctx, args.tenantId, "instructor");
    }
    assertTitle(args.title);
    assertBody(args.bodyMd);
    const link = optionalField(args.linkUrl, assertLinkUrl);
    const video = optionalField(args.youtubeVideoId, assertYoutubeVideoId);

    const now = Date.now();
    assertUnderDailyPostLimit(
      await countRecentPostsByUser(ctx, userId, now),
      link.value !== undefined
    );

    const postId = await ctx.db.insert("posts", {
      tenantId: args.tenantId,
      authorId: userId,
      kind: args.kind,
      title: args.title.trim(),
      bodyMd: args.bodyMd.trim(),
      linkUrl: link.value,
      youtubeVideoId: video.value,
      pinned: false,
      lastActivityAt: now,
      likeCount: 0,
      commentCount: 0,
    });

    // A pengumuman keeps everything the retired announcements board did (#33):
    // the Discord webhook and the in-app member fan-out. Both are
    // fire-and-forget — runAfter(0) keeps the mutation fast and the write
    // atomic, and neither failure may fail the create (the post is saved and
    // the feed already shows it). The webhook URL is NEVER touched here; the
    // internal action reads it server-side (DATA-MODEL security note #1).
    if (args.kind === "pengumuman") {
      const post = await ctx.db.get(postId);
      if (post !== null) {
        await ctx.scheduler.runAfter(0, postToDiscordRef, { postId });
        await scheduleAnnouncementFanout(ctx, { post, senderId: userId });
      }
    }

    return postId;
  },
});

/**
 * Edit a post — author OR instructor+ of the post's tenant. `kind` is
 * DELIBERATELY not editable: a member could otherwise promote their own
 * `diskusi` into a `pengumuman` and route around the instructor+ gate on
 * create. Passing "" for linkUrl/youtubeVideoId clears that field; omitting
 * the arg leaves it untouched. Editing is not activity — lastActivityAt and
 * the counters are left alone.
 */
export const edit = mutation({
  args: {
    postId: v.id("posts"),
    title: v.optional(v.string()),
    bodyMd: v.optional(v.string()),
    linkUrl: v.optional(v.string()),
    youtubeVideoId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { post } = await requireAuthorOrInstructorForPost(ctx, args.postId);
    assertLive(post);

    const patch: {
      title?: string;
      bodyMd?: string;
      linkUrl?: string | undefined;
      youtubeVideoId?: string | undefined;
    } = {};
    if (args.title !== undefined) {
      assertTitle(args.title);
      patch.title = args.title.trim();
    }
    if (args.bodyMd !== undefined) {
      assertBody(args.bodyMd);
      patch.bodyMd = args.bodyMd.trim();
    }
    const link = optionalField(args.linkUrl, assertLinkUrl);
    if (link.set) patch.linkUrl = link.value;
    const video = optionalField(args.youtubeVideoId, assertYoutubeVideoId);
    if (video.set) patch.youtubeVideoId = video.value;

    await ctx.db.patch(post._id, patch);
    return post._id;
  },
});

/**
 * Soft delete — author OR instructor+ of the post's tenant. Sets deletedAt; the
 * row is NEVER hard-deleted (its comments keep their anchor, and every read
 * filters deletedAt). Idempotent: deleting twice keeps the first timestamp.
 */
export const softDelete = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const { post } = await requireAuthorOrInstructorForPost(ctx, args.postId);
    if (post.deletedAt === undefined) {
      await ctx.db.patch(post._id, { deletedAt: Date.now() });
    }
    return post._id;
  },
});

/**
 * Pin / unpin — INSTRUCTOR+ only (never the author: pinning is moderation, and
 * the feed sorts pinned rows to the top for every anonymous reader). Returns
 * the new state so the client does not have to re-read.
 */
export const togglePin = mutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const { post } = await requireInstructorForPost(ctx, args.postId);
    assertLive(post);
    const pinned = !post.pinned;
    await ctx.db.patch(post._id, { pinned });
    return { pinned };
  },
});
