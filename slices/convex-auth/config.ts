import { defineFeature } from "@/shared/features/defineFeature";

// No `routes`: the sign-in surface is an app-level page that mounts <AuthCard>,
// not a slice-owned route (the old /sign-in view went with the multi-provider
// page). Metadata only.
export const convexAuthConfig = defineFeature({
  slug: "convex-auth",
  title: "Convex Auth — Google sign-in",
  category: "auth",
  routes: [],
  nav: { label: "Masuk", group: "auth", order: 0 },
});
