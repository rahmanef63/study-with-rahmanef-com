// The site-settings contract — the shape the onboarding/admin Settings UI writes
// and the public surfaces read. Mirrors the Convex `siteSettings` singleton (all
// optional; one row). Centralised so every surface shares one definition.
export type SiteSettings = {
  siteName?: string;
  tagline?: string;
  ownerName?: string;
  contactEmail?: string;
  brandColor?: string;
  themeDefault?: string; // "light" | "dark" | "system"
  logoUrl?: string;
  faviconUrl?: string;
  socials?: string; // JSON string
  seoDescription?: string;
  analyticsId?: string;
  onboardedAt?: number;
};

// The editable subset (everything except the server-managed onboardedAt).
export type SiteSettingsInput = Omit<SiteSettings, "onboardedAt">;
