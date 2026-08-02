// Identity provider registry (Convex deploy-time platform config).
// Required by @convex-dev/auth: convexAuth() mints session JWTs with
// iss = CONVEX_SITE_URL and aud = "convex" (tokens.ts), but Convex only
// validates them if a matching provider is registered HERE. Without this file
// getUserIdentity() returns null and every login reads as "not authenticated".
export default {
  providers: [
    {
      domain: process.env.CONVEX_SITE_URL,
      applicationID: "convex",
    },
  ],
};
