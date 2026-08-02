// roadmap slice — feature descriptor (pattern: slices/progress/config.ts).
// No standalone route: it provides the CourseNav rail beside the Kelas lesson sheet.
import { defineFeature } from "@/shared/features/defineFeature";

export const roadmapFeature = defineFeature({
  slug: "roadmap",
  title: "Nav materi — sidebar lesson per kelas",
  category: "lms",
});
