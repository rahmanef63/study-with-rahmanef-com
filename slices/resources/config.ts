// resources slice — feature descriptor (pattern: slices/courses/config.ts).
// Routes are MOUNTED by the integrator (app/ is integrator-only); these entries
// document the intended mounts on the /t/[slug] shell:
//   /t/[slug]/resources ← <ResourceBoardView tenantId canModerate />
//   /t/[slug]/usulan    ← <SuggestionBoxView tenantId canModerate />
import { defineFeature } from "@/shared/features/defineFeature";

export const resourcesFeature = defineFeature({
  slug: "resources",
  title: "Sumber & Usulan — resource board + kotak usulan",
  category: "community",
  nav: { label: "Sumber", group: "tenant", order: 3 },
});
