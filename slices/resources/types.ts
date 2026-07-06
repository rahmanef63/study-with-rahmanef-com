// resources slice — client types. Server-owned shapes/codes are re-exported
// from the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).

/** Read projections returned by the resources queries. */
export type {
  ResourceCard,
  ResourceReviewItem,
  SuggestionCard,
} from "@convex/features/resources/projections";

/** Typed error union thrown by the resources feature. */
export type { ResourcesErrorCode } from "@convex/features/resources/errors";

/** Resource lifecycle status (schema literals). */
export type ResourceStatus = "pending" | "approved" | "rejected";
/** Suggestion lifecycle status (schema literals). */
export type SuggestionStatus = "open" | "planned" | "done" | "rejected";
