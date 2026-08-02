// notifications feature — safe projection (#21). Queries never return raw
// docs (AGENTS.md §6): the recipient sees exactly the fields below and nothing
// else (no producer internals, no other users' ids). userId/tenantId are
// intentionally OMITTED — the caller IS the recipient, and the tenant context
// lives inside `href`.
import type { Doc, Id } from "../../_generated/dataModel";

export type NotificationKind = Doc<"notifications">["kind"];

export type NotificationItem = {
  _id: Id<"notifications">;
  kind: NotificationKind;
  title: string;
  body: string | null;
  /** Relative OS-shell deep-link (e.g. /kelas/<tenant>/<course>/lesson/<id>). */
  href: string | null;
  createdAt: number;
  readAt: number | null;
};

export function toNotificationItem(row: Doc<"notifications">): NotificationItem {
  return {
    _id: row._id,
    kind: row.kind,
    title: row.title,
    body: row.body ?? null,
    href: row.href ?? null,
    createdAt: row._creationTime,
    readAt: row.readAt ?? null,
  };
}
