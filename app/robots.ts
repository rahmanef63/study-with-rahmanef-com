import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/lib/convex-server";

// Until now /robots.txt was swallowed by the catch-all and returned the OS
// desktop HTML with a 200 — so crawlers got a page, not a policy.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Nothing under these is public content: /admin is platform-admin only,
      // /api is machinery, /masuk is an auth hand-off.
      disallow: ["/admin", "/api/", "/masuk"],
    },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
