// posts slice — client types. Server-owned shapes/codes are re-exported from
// the convex feature so client and server share ONE SSOT (@convex/* is an
// allowed cross-slice path per rr-conventions "barrel-only imports"; the
// re-exports are type-only, nothing server-side reaches the client bundle).

/** Read projections returned by publicListFeed / publicGetPost / listMine. */
export type {
  MinePost,
  PostAuthor,
  PublicPost,
  PublicPostPage,
} from "@convex/features/posts/projections";

/** Typed error union thrown by the posts feature. */
export type { PostsErrorCode } from "@convex/features/posts/errors";

/**
 * Post category. The union is the SSOT for the whole feature — there is no
 * categories table on purpose (DECISIONS #29): four fixed kinds, validated by
 * `kindValidator` in convex/features/posts/queries.ts and mirrored here.
 */
export type PostKind = "diskusi" | "pengumuman" | "usulan" | "sumber";

/** Feed filter — `null` is "Semua" (no `kind` arg sent at all). */
export type PostKindFilter = PostKind | null;
