// quiz slice — feature descriptor (pattern: slices/courses/config.ts).
// Routes are MOUNTED by the integrator (app/ is integrator-only); these
// entries document the intended mounts for the /t/[slug] shell.
import { defineFeature } from "@/shared/features/defineFeature";

export const quizFeature = defineFeature({
  slug: "quiz",
  title: "Kuis — MCQ builder + attempt + auto-grade",
  category: "lms",
  nav: { label: "Kuis", group: "tenant", order: 2 },
});
