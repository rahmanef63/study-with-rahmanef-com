// Auth entry — Google OAuth only (PRD R1; DECISIONS #15).
// Adding providers later = add to this array (see @convex-dev/auth docs).
import Google from "@auth/core/providers/google";
import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Google],
});
