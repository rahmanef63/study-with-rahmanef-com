// events feature — the ONLY shape a read ever returns (P0 AGENTS.md §6:
// explicit safe projection, never a raw doc).
//
// Dropped on purpose: `tenantId` (the caller already holds it), `createdBy`
// (an anonymous visitor must not learn WHO schedules a community's sessions —
// that is user data beyond public-profile fields), `canceledAt` (canceled rows
// never reach a projection, see queries.ts) and `_creationTime`.
//
// `locationUrl` is MEMBER-ONLY. It is the Discord/YouTube join link for a live
// session — publishing it anonymously would hand the room to anyone with the
// community slug, which is the one thing a members-only session is not. Anon
// callers get `hasLocation` instead, so the UI can still say "ada link gabung"
// and put a Gabung CTA next to it.
// Optionals become `null` so the key set is stable across rows — the anonymous
// projection specs assert it key-by-key.
import type { Doc, Id } from "../../_generated/dataModel";

export type PublicEvent = {
  _id: Id<"events">;
  title: string;
  description: string | null;
  startsAt: number;
  endsAt: number | null;
  /** Whether a join link exists — always present, for anon and members alike. */
  hasLocation: boolean;
  /** The join link itself. `null` for anon callers even when one exists. */
  locationUrl: string | null;
};

export function toPublicEvent(event: Doc<"events">, isMember: boolean): PublicEvent {
  return {
    _id: event._id,
    title: event.title,
    description: event.description ?? null,
    startsAt: event.startsAt,
    endsAt: event.endsAt ?? null,
    hasLocation: event.locationUrl !== undefined,
    locationUrl: isMember ? (event.locationUrl ?? null) : null,
  };
}
