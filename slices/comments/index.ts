// comments slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Integration point for alpha (#16): mount
//   <LessonComments lessonId={lesson._id} />
// under the lesson content in the lesson window-app. The component is
// self-contained — reads, writes, and the viewer's moderation flag all come
// from the Convex feature; no extra props required.
//
// Convex surface (not re-exported; call via api.features.comments.*):
//   comments:addComment · comments:softDelete · queries:listByLesson

// feature descriptor
export { commentsFeature } from "./config";

// connected view (integrator mounts this)
export { LessonComments, type LessonCommentsProps } from "./views/lesson-comments";

// presentational components (props-driven, portable)
export { CommentForm, type CommentFormProps } from "./components/comment-form";
export { CommentItem, type CommentItemProps } from "./components/comment-item";
export { CommentThread, type CommentThreadProps } from "./components/comment-thread";
export { CommentsEmptyState, type CommentsEmptyStateProps } from "./components/comments-empty-state";
export { DeleteCommentDialog, type DeleteCommentDialogProps } from "./components/delete-comment-dialog";

// hooks (reads + writes)
export { useLessonComments } from "./hooks/use-lesson-comments";
export { useAddComment, useDeleteComment, type AddCommentInput } from "./hooks/use-comment-mutations";

// lib (pure — safe for server or client)
export { buildThread, type CommentThread as CommentThreadData } from "./lib/thread";
export { formatRelativeTime } from "./lib/time";
export { commentsErrorMessage, extractCommentsError } from "./lib/errors";

// copy (props-driven defaults)
export {
  COMMENTS_COPY,
  mergeCommentsCopy,
  type CommentsCopy,
  type CommentsCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export { MAX_BODY, MIN_BODY, MAX_COMMENTS_PER_USER_PER_LESSON } from "./config/limits";

// types
export type {
  CommentAuthor,
  CommentItem as CommentItemData,
  CommentsErrorCode,
  LessonCommentsResult,
} from "./types";
