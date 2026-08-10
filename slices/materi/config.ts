// materi slice — feature descriptor (pattern: slices/posts/config.ts).
// Routes are MOUNTED by the integrator (app/ is integrator-only); these are
// the intended mounts on the /k/[slug] shell:
//   /k/[slug]/materi                ← <MateriLibraryView tenantId … />
//   /k/[slug]/materi/[lessonSlug]   ← server etalase header + <MateriDetailView />
import { defineFeature } from "@/shared/features/defineFeature";

export const materiFeature = defineFeature({
  slug: "materi",
  title: "Materi — perpustakaan materi komunitas",
  category: "lms",
  // order 1: a materi is tenant-level content and the library is the widest
  // door into the product (see the COMMUNITY_TABS order comment in
  // lib/community.ts). Kelas is order 1 in its own descriptor for historical
  // reasons; the tab strip order lives in lib/community.ts, not here.
  nav: { label: "Materi", group: "tenant", order: 1 },
});
