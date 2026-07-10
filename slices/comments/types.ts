// comments slice — client types. Server-owned shapes/codes are re-exported
// from the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).

/** Read projections returned by listByLesson. */
export type {
  CommentAuthor,
  CommentItem,
  LessonCommentsResult,
} from "@convex/features/comments/projections";

/** Typed error union thrown by the comments feature. */
export type { CommentsErrorCode } from "@convex/features/comments/errors";
