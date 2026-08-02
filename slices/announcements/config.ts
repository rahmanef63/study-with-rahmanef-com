// announcements slice — feature descriptor (pattern: slices/courses/config.ts).
// The route is MOUNTED by the integrator (app/ is integrator-only); this entry
// documents the intended mount for the /t/[slug] shell:
//   /t/[slug]/pengumuman  ←  <AnnouncementsView tenantId canManage />
import { defineFeature } from "@/shared/features/defineFeature";

export const announcementsFeature = defineFeature({
  slug: "announcements",
  title: "Pengumuman — in-app + Discord webhook",
  category: "community",
  nav: { label: "Pengumuman", group: "tenant", order: 4 },
});
