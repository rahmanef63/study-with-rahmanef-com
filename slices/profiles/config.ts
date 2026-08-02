// Feature config — the integrator mounts the route from this descriptor
// (route mounting is app-level work, AGENTS.md §4; SLICES.md maps profiles to
// /pengaturan/profil). Pattern mirrors slices/convex-auth/config.ts.
import { defineFeature } from "@/shared/features/defineFeature";

export const profilesFeature = defineFeature({
  slug: "profiles",
  title: "Profil — Pengaturan Akun",
  category: "identity",
  routes: [
    {
      path: "/pengaturan/profil",
      view: () => import("./components/profile-settings-view"),
    },
  ],
  nav: { label: "Pengaturan Profil", group: "akun", order: 10 },
});
