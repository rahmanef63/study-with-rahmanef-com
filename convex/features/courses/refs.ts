// courses feature — function references for scheduled targets.
import { makeFunctionReference } from "convex/server";

/** internalMutation — self-rescheduling materi backfill (materiBackfill.ts). */
export const materiBackfillRef = makeFunctionReference<"mutation", { cursor?: number }>(
  "features/courses/materiBackfill:run"
);
