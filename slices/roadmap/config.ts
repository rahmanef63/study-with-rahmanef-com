// roadmap slice — feature descriptor (pattern: slices/progress/config.ts).
// No standalone route: it fills the Kelas overview via a Silabus ⇄ Roadmap toggle.
import { defineFeature } from "@/shared/features/defineFeature";

export const roadmapFeature = defineFeature({
  slug: "roadmap",
  title: "Roadmap — peta belajar per kelas",
  category: "lms",
});
