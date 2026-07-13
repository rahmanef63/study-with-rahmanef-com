// search slice — feature descriptor (pattern: slices/comments/config.ts).
// Integration is alpha's: the OS shell mounts <SearchView tenantId tenantSlug
// onNavigate /> as a window-app (see index.ts barrel notes).
import { defineFeature } from "@/shared/features/defineFeature";

export const searchFeature = defineFeature({
  slug: "search",
  title: "Pencarian — kelas & materi per komunitas",
  category: "lms",
  nav: { label: "Cari", group: "tenant", order: 5 },
});
