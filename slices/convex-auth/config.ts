import { defineFeature } from "@/shared/features/defineFeature";

export const convexAuthConfig = defineFeature({
  slug: "convex-auth",
  title: "Convex Auth — Multi-Provider Sign-in",
  category: "auth",
  routes: [
    { path: "/sign-in", view: () => import("./components/sign-in-page") },
  ],
  nav: { label: "Sign in", group: "auth", order: 0 },
});
