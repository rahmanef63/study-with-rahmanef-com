import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { POSTS_COPY, postKindLabel, toExcerpt } from "@/features/posts";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

// Per-post social card — the unfurl a shared permalink produces in WhatsApp.
// Two independent etalase reads (post + tenant, neither depends on the other);
// safeQuery never throws, so a deleted or unreadable post still gets a branded
// card instead of a broken image.
export const alt = "Post diskusi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const [post, tenant] = await Promise.all([
    safeQuery(api.features.posts.queries.publicGetPost, { postId: postId as Id<"posts"> }),
    safeQuery(api.features.tenants.queries.getPublicBySlug, { slug }),
  ]);

  const kindLabel = post === null ? "Diskusi" : postKindLabel(post.kind, POSTS_COPY);
  return ogCard({
    eyebrow: tenant === null ? kindLabel : `${tenant.name} · ${kindLabel}`,
    title: post?.title ?? "Post",
    subtitle: post === null ? undefined : toExcerpt(post.bodyMd, 110),
  });
}
