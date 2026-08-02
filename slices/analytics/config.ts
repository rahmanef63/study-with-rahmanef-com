// analytics slice — feature descriptor (pattern: slices/progress/config.ts).
// Analytics has NO standalone route: CourseAnalyticsView mounts inside the
// kelola window-app (alpha integrates it), so there are no `routes` here.
import { defineFeature } from "@/shared/features/defineFeature";

export const analyticsFeature = defineFeature({
  slug: "analytics",
  title: "Analitik — agregat instruktur per kelas",
  category: "lms",
});
