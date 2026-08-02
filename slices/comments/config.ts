// comments slice — feature descriptor (pattern: slices/resources/config.ts).
// Integration is alpha's: the lesson window-app mounts <LessonComments
// lessonId /> under the lesson content (see index.ts barrel notes).
import { defineFeature } from "@/shared/features/defineFeature";

export const commentsFeature = defineFeature({
  slug: "comments",
  title: "Diskusi — komentar per lesson",
  category: "community",
  nav: { label: "Diskusi", group: "tenant", order: 4 },
});
