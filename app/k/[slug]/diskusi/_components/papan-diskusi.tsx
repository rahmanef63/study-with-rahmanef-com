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
      // The logged-out gate is now the FIRST thing on the phone feed, since
      // this page's own title block is gone — so its words are worth 40px.
      // The slice's default title runs to two full Press Start 2P lines and
      // the hint to three; these say the same thing in one and two. The
      // gate's HEIGHT is structural and lives in slices/posts (FeedView) —
      // reported upward; `copy` is the only lever a consumer is given.
      copy={{
        gateTitle: "Gabung untuk menulis",
        gateHint: "Baca bebas untuk siapa saja. Menulis, menyukai, dan membalas khusus anggota.",
      }}
    />
  );
}
