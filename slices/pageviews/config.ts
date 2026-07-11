// pageviews slice — feature descriptor (pattern: slices/analytics/config.ts).
// No standalone route in the descriptor: alpha mounts TrafficView on the
// /admin/traffic route (and could mount it in an OS admin window too).
import { defineFeature } from "@/shared/features/defineFeature";

export const pageviewsFeature = defineFeature({
  slug: "pageviews",
  title: "Traffic — analitik pengunjung tanpa cookie",
  category: "admin",
});
