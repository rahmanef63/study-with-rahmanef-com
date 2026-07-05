import { query } from "./_generated/server";

// Onboarding state for the admin UI. Public (no PII) so the login form and the
// dashboard setup banner can adapt before/after sign-in. Part of headless-core.
export const status = query({
  args: {},
  handler: async (ctx) => {
    const owner = await ctx.db.query("users").first();
    const settings = await ctx.db.query("siteSettings").first();
    const keyConfigured = !!process.env.ADMIN_SIGNUP_KEY;
    const ownerClaimed = !!owner;
    return {
      ownerClaimed,
      // JWT auth keys present? (setup-auth.mjs provisions them at build; a
      // deploy key without WriteEnvironmentVariables leaves them missing.)
      authReady: !!process.env.JWT_PRIVATE_KEY,
      // Onboarding wizard is done once the owner finishes it (onboardedAt set).
      onboarded: !!settings?.onboardedAt,
      // Signup is open if no owner has claimed yet, or a key is configured (invites).
      signupOpen: !ownerClaimed || keyConfigured,
      // The "Setup key" field is only needed when a key is configured.
      signupKeyRequired: keyConfigured,
    };
  },
});
