// peta slice — feature descriptor (pattern: slices/roadmap/config.ts).
// One route, /mulai, mounted by app/mulai/page.tsx.
import { defineFeature } from "@/shared/features/defineFeature";

export const petaFeature = defineFeature({
  slug: "peta",
  title: "Peta belajar — kuesioner & rencana",
  category: "lms",
});
