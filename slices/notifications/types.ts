// notifications slice — client-side types. Mirrors the server projection in
// convex/features/notifications/projections.ts and the error union in
// convex/features/notifications/errors.ts — keep both in sync.
import type { Id } from "@convex/_generated/dataModel";

export type NotificationKind =
  | "comment_reply"
  | "post_reply"
  | "event_soon"
  | "announcement"
  // Retired producers. The literals stay because production rows still carry
  // them — the schema union may only be narrowed after a backfill.
  | "resource_reviewed"
  | "suggestion_status";

export type NotificationItemData = {
  _id: Id<"notifications">;
  kind: NotificationKind;
  title: string;
  body: string | null;
  /** Relative in-app route (e.g. /k/<tenant>/kelas/<course>/<lessonId>). */
  href: string | null;
  createdAt: number;
  readAt: number | null;
};

export type NotificationsErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "RATE_LIMITED";
