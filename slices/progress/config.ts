// progress slice — feature descriptor (pattern: slices/courses/config.ts).
// Progress has NO standalone route: its surfaces embed in the courses pages via
// the barrel seams (LessonView.completionSlot, CourseOverview.progressSlot), so
// there are no `routes` to mount — the integrator drops the views into courses.
import { defineFeature } from "@/shared/features/defineFeature";

export const progressFeature = defineFeature({
  slug: "progress",
  title: "Progres — tandai selesai + penyelesaian kelas",
  category: "lms",
});
