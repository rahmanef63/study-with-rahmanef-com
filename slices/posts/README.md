# posts slice — Diskusi feed + post permalink

Frontend for `convex/features/posts` (v1.8 #29/#30). The backend was landed by
the Convex wave and is **not** modified by this slice.

## Mounts

```tsx
// /k/[slug]/diskusi — SERVER component reads the first page anonymously
const firstPage = await safeQuery(api.features.posts.queries.publicListFeed, {
  tenantId,
  paginationOpts: { numItems: FEED_PAGE_SIZE, cursor: null },
});

<FeedView
  tenantId={tenantId}
  initialPosts={firstPage?.page ?? []}
  postHref={(postId) => communityHref.post(slug, postId)}
  profileHref={(username) => communityHref.profile(username)}
  loginHref={`/masuk?next=${encodeURIComponent(communityHref.diskusi(slug))}`}
/>
```

```tsx
// /k/[slug]/post/[postId] — SERVER page renders the body, a client island the replies
<PostBody bodyMd={post.bodyMd} />
<YoutubeEmbed videoId={post.youtubeVideoId} title={post.title} />   // @/features/courses
<PostComments postId={post._id} />                                  // @/features/comments
```

## Contract notes

- **`initialPosts` is the indexability contract.** `FeedView` renders it on the
  first render (server *and* client), so the feed is crawlable HTML and there is
  no hydration flicker; the live paginated query takes over when the socket
  answers. A kind filter falls back to *nothing*, never to the unfiltered
  server page.
- **Anonymous vs member.** `publicListFeed` / `publicGetPost` are anonymous
  etalase. The composer, likes (`myLikedPostIds`, `toggleLike`) and the reply
  thread are member-gated and stay in client islands that `"skip"` while
  logged out — calling them anonymously would throw into the error boundary
  instead of rendering the join CTA.
- **Four fixed kinds, no categories table** (`diskusi | pengumuman | usulan |
  sumber`). `pengumuman` is hidden from a plain member in the composer; the
  server re-checks instructor+ (P0).
- **No file upload** — PRD non-goal. A post is markdown + at most one http(s)
  link + one 11-char YouTube id.
- **One markdown renderer.** `PostBody` delegates to `MarkdownView`
  (`@/features/courses`); feed cards use the pure plain-text collapse in
  `lib/excerpt.ts` instead of parsing markdown per card.
- **`RATE_LIMITED` is expected.** 10 posts/day, 3 with a link. `postsErrorMessage`
  surfaces the server's Bahasa sentence, never the code.
