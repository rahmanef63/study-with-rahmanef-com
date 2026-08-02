// announcements slice — public types (the contract consumers rely on).
// Server-owned shapes/codes are re-exported from the convex feature so client and
// server share ONE SSOT (@convex/* is an allowed cross-slice path per
// rr-conventions "barrel-only imports"; these are type-only, nothing server-side
// reaches the client bundle).
import type { Id } from "@convex/_generated/dataModel";

/** list result row — the safe projection (never carries the tenant webhook). */
export type { AnnouncementView } from "@convex/features/announcements/validate";
/** Typed error union thrown by the announcements feature. */
export type { AnnouncementsErrorCode } from "@convex/features/announcements/errors";

/** Values the create form submits. */
export type CreateAnnouncementValues = {
  title: string;
  bodyMd: string;
};

/** create mutation result. */
export type CreateAnnouncementResult = {
  announcementId: Id<"announcements">;
};
