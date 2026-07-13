// search slice — client types. Server-owned shapes/codes are re-exported from
// the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).

/** Read projections returned by searchInTenant. */
export type {
  CourseHit,
  LessonHit,
  SearchHit,
  SearchInTenantResult,
} from "@convex/features/search/projections";

/** Typed error union thrown by the search feature. */
export type { SearchErrorCode } from "@convex/features/search/errors";
