// asisten slice — feature descriptor (pattern: slices/search/config.ts).
// Integration alpha: window-app "asisten" + capabilities.useChat (Inspector ⌘I).
import { defineFeature } from "@/shared/features/defineFeature";

export const asistenFeature = defineFeature({
  slug: "asisten",
  title: "Alfa — asisten belajar AI",
  category: "lms",
  nav: { label: "Alfa", group: "tenant", order: 6 },
});
