import { defineFeature } from "@/shared/features/defineFeature";

export const tenantsFeature = defineFeature({
  slug: "tenants",
  title: "Tenants — community profile, join flow, memberships & roles",
  category: "community",
  routes: [],
  nav: { label: "Komunitas", group: "community", order: 10 },
});
