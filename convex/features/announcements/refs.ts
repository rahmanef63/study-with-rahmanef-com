// announcements feature — function references by path.
//
// WHY makeFunctionReference (not `internal.features.announcements.*`): the
// checked-in convex/_generated/api.d.ts is the STRICT typed variant and does not
// yet include this brand-new feature; regenerating _generated is integrator-only
// (AGENTS.md §4 — convex/_generated is a shared surface). makeFunctionReference
// resolves by the same path string at runtime (convex-test + anyApi both honour
// it) AND keeps `npx tsc --noEmit` green while this slice is built in isolation.
// TODO(rr): after alpha runs `npx convex dev/deploy`, these MAY be swapped for
// `internal.features.announcements.*` — runtime behaviour is identical.
import { makeFunctionReference } from "convex/server";
import type { Id } from "../../_generated/dataModel";

/** Payload the internal query hands to the Discord action (server-only). */
export type DiscordDispatch = {
  title: string;
  bodyMd: string;
  tenantName: string;
  /** RAHASIA — never leaves the internal action (DATA-MODEL security note #1). */
  webhookUrl: string | null;
} | null;

type AnnId = { announcementId: Id<"announcements"> };

/** internalAction — scheduled by `create`; posts to Discord server-side. */
export const postToDiscordRef = makeFunctionReference<"action", AnnId>(
  "features/announcements/discord:postToDiscord"
);

/** internalQuery — loads announcement + webhook for the action (server-only). */
export const loadForDiscordRef = makeFunctionReference<"query", AnnId, DiscordDispatch>(
  "features/announcements/discord:loadForDiscord"
);

/** internalMutation — flips postedToDiscord=true after a successful post. */
export const markPostedRef = makeFunctionReference<"mutation", AnnId>(
  "features/announcements/discord:markPostedToDiscord"
);
