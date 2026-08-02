// notifications slice — feature descriptor (pattern: slices/comments/config.ts).
// Integration is alpha's: the OS shell HEADER mounts <NotificationBell /> for
// signed-in users (see index.ts barrel notes).
import { defineFeature } from "@/shared/features/defineFeature";

export const notificationsFeature = defineFeature({
  slug: "notifications",
  title: "Notifikasi — inbox in-app",
  category: "community",
  nav: { label: "Notifikasi", group: "tenant", order: 6 },
});
