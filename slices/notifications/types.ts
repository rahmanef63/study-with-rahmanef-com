// notifications slice — client-side types. Mirrors the server projection in
// convex/features/notifications/projections.ts and the error union in
// convex/features/notifications/errors.ts — keep both in sync.
import type { Id } from "@convex/_generated/dataModel";

export type NotificationKind =
  | "comment_reply"
  | "resource_reviewed"
  | "suggestion_status"
  | "announcement"; // v1.4 #28 — producer lands with beta; type pre-extended by alpha (schema union already shipped)

export type NotificationItemData = {
  _id: Id<"notifications">;
  kind: NotificationKind;
  title: string;
  body: string | null;
  /** Relative OS-shell deep-link (e.g. /kelas/<tenant>/<course>/lesson/<id>). */
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
