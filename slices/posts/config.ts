// posts slice — feature descriptor (pattern: slices/comments/config.ts).
// Routes are MOUNTED by the integrator (app/ is integrator-only); these entries
// document the intended mounts on the /k/[slug] shell:
//   /k/[slug]/diskusi         ← <FeedView tenantId initialPosts … />
//   /k/[slug]/post/[postId]   ← server page + <PostBody /> + comments thread
import { defineFeature } from "@/shared/features/defineFeature";

export const postsFeature = defineFeature({
  slug: "posts",
  title: "Diskusi — feed post komunitas",
  category: "community",
  nav: { label: "Diskusi", group: "tenant", order: 2 },
});
