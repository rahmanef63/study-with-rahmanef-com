// posts feature — function references by path.
//
// WHY makeFunctionReference (not `internal.features.posts.*`): the checked-in
// convex/_generated/api.d.ts is the STRICT typed variant and regenerating it is
// integrator-only (AGENTS.md §4 — convex/_generated is a shared surface).
// makeFunctionReference resolves by the same path string at runtime (convex-test
// and anyApi both honour it) AND keeps `npx tsc --noEmit` green while this
// feature is extended in isolation. Precedent: the retired
// convex/features/announcements/refs.ts, which these entries replace.
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

type PostRef = { postId: Id<"posts"> };

/** internalAction — scheduled by posts:create for `kind: "pengumuman"`. */
export const postToDiscordRef = makeFunctionReference<"action", PostRef>(
  "features/posts/discord:postToDiscord"
);

/** internalQuery — loads post + tenant webhook for the action (server-only). */
export const loadForDiscordRef = makeFunctionReference<"query", PostRef, DiscordDispatch>(
  "features/posts/discord:loadForDiscord"
);

/** Phases of the one-shot legacy-board backfill, in execution order. */
export const BACKFILL_PHASES = [
  "announcements",
  "resources",
  "suggestions",
  "votes",
] as const;

export type BackfillPhase = (typeof BACKFILL_PHASES)[number];

/** internalMutation — self-rescheduling backfill (see backfill.ts). */
export const backfillRunRef = makeFunctionReference<
  "mutation",
  { phase?: BackfillPhase; cursor?: number }
>("features/posts/backfill:run");
