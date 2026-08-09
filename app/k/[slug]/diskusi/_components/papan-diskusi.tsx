"use client";

// Client island around FeedView.
//
// It exists for ONE reason: FeedView takes href BUILDERS (postHref/profileHref)
// so the slice never hardcodes a route, and a function prop cannot cross the
// server→client boundary — React throws "Functions cannot be passed directly to
// Client Components", which lands in app/error.tsx and takes the whole page
// down. The server page hands over plain data (slug + the prerendered first
// page); the builders are constructed here, in the browser bundle.
import type { Id } from "@convex/_generated/dataModel";
import { FeedView, type PostKindFilter, type PublicPost } from "@/features/posts";
import { communityHref } from "@/lib/community";

export function PapanDiskusi({
  tenantId,
  slug,
  initialPosts,
  initialKind,
}: {
  tenantId: Id<"tenants">;
  slug: string;
  initialPosts: PublicPost[];
  initialKind: PostKindFilter;
}) {
  return (
    <FeedView
      tenantId={tenantId}
      initialPosts={initialPosts}
      initialKind={initialKind}
      postHref={(postId) => communityHref.post(slug, postId)}
      profileHref={(username) => communityHref.profile(username)}
      loginHref={`/masuk?next=${encodeURIComponent(communityHref.diskusi(slug))}`}
    />
  );
}
