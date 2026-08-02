// comments slice — UI mirrors of the server bounds. Keep in sync with
// convex/features/comments/validate.ts + antiSpam.ts (server is the SSOT and
// re-validates; these only drive maxLength/counter UX).
export const MIN_BODY = 1;
export const MAX_BODY = 2000;
export const MAX_COMMENTS_PER_USER_PER_LESSON = 20;
