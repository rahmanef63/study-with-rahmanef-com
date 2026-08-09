// posts slice — public barrel (THE contract; barrel-only cross-slice imports,
// rr-conventions P1). The integrator mounts:
//   /k/[slug]/diskusi        ← <FeedView tenantId initialPosts postHref
//                                profileHref loginHref />
//   /k/[slug]/post/[postId]  ← server page: <PostBody bodyMd /> + YoutubeEmbed
//                                (@/features/courses) + <PostComments postId />
//                                (@/features/comments)
//
// Convex surface (not re-exported; call via api.features.posts.*):
//   posts:create · posts:edit · posts:softDelete · posts:togglePin ·
//   likes:toggleLike · likes:myLikedPostIds ·
//   queries:publicListFeed (ANONYMOUS) · queries:publicGetPost (ANONYMOUS) ·
//   queries:listMine

// feature descriptor
export { postsFeature } from "./config";

// connected view (integrator mounts this)
export { FeedView, type FeedViewProps } from "./views/feed-view";

// presentational components (props-driven, portable)
export { PostCard, type PostCardProps } from "./components/post-card";
export { PostBody, type PostBodyProps } from "./components/post-body";
export { CategoryChips, type CategoryChipsProps } from "./components/category-chips";
export {
  PostComposer,
  type PostComposerProps,
  type PostComposerValues,
} from "./components/post-composer";

// hooks (reads + writes)
export { usePostFeed, useMyPosts, type PostFeed, type PostFeedStatus } from "./hooks/use-post-feed";
export { useMyLikedPostIds } from "./hooks/use-post-likes";
export {
  useCreatePost,
  useToggleLike,
  type CreatePostInput,
} from "./hooks/use-post-mutations";

// lib (pure — safe for server or client)
export { POST_KINDS, postKindLabel, postKindTone, parsePostKind } from "./lib/kind";
export { toExcerpt, toPlainText } from "./lib/excerpt";
export { formatRelativeTime, toIsoDate } from "./lib/time";
export { postsErrorMessage, extractPostsError, isRateLimited } from "./lib/errors";

// copy (props-driven defaults)
export {
  POSTS_COPY,
  mergePostsCopy,
  type PostsCopy,
  type PostsCopyOverride,
} from "./config/copy";

// limits (UI mirrors of the server bounds)
export {
  EXCERPT_CHARS,
  FEED_PAGE_MAX,
  FEED_PAGE_SIZE,
  MAX_BODY,
  MAX_LINK_POSTS_PER_DAY,
  MAX_POSTS_PER_DAY,
  MAX_TITLE,
  MAX_URL,
  MIN_BODY,
  MIN_TITLE,
} from "./config/limits";

// types
export type {
  MinePost,
  PostAuthor,
  PostKind,
  PostKindFilter,
  PostsErrorCode,
  PublicPost,
  PublicPostPage,
} from "./types";
