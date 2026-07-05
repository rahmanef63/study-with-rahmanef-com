// courses slice — feature descriptor (pattern: slices/convex-auth/config.ts).
// Routes are MOUNTED by the integrator (app/ is integrator-only); these
// entries document the intended mounts for the /t/[slug] shell.
import { defineFeature } from "@/shared/features/defineFeature";

export const coursesFeature = defineFeature({
  slug: "courses",
  title: "Kelas — course/module/lesson + lesson player",
  category: "lms",
  nav: { label: "Kelas", group: "tenant", order: 1 },
});
