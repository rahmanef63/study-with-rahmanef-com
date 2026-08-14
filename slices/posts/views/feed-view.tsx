"use client";
// posts slice — FeedView: the connected Diskusi feed the integrator mounts on
// /k/[slug]/diskusi.
//
// SSR hand-off (#29, the whole point): the server page reads the first page of
// publicListFeed and passes it as `initialPosts`. This component renders those
// rows on its FIRST render — server AND client — so the feed is real HTML for a
// crawler and there is no hydration flicker; the live socket takes over as soon
// as the paginated query answers. A kind filter falls back to nothing, never to
// the unfiltered server page.
import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyArt,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyMembership } from "@/features/tenants";
import type { Id } from "@convex/_generated/dataModel";
import { parsePostKind } from "../lib/kind";
import { CategoryChips } from "../components/category-chips";
import { PostCard } from "../components/post-card";
import { PostComposer } from "../components/post-composer";
import { mergePostsCopy, type PostsCopyOverride } from "../config/copy";
import { FEED_PAGE_SIZE } from "../config/limits";
import { useMyLikedPostIds } from "../hooks/use-post-likes";
import { usePostFeed } from "../hooks/use-post-feed";
import { useCreatePost, useToggleLike } from "../hooks/use-post-mutations";
import type { PostKindFilter, PublicPost } from "../types";

export type FeedViewProps = {
  tenantId: Id<"tenants">;
  /** Server-rendered first page (unfiltered). Omit to render client-only. */
  initialPosts?: PublicPost[];
  /**
   * Category the feed opens on — the consumer's `?kind=` deep link, parsed
   * with `parsePostKind`. `null`/omitted is "Semua". Only the STARTING
   * position: the chips stay component state, so filtering never re-navigates.
   */
  initialKind?: PostKindFilter;
  /** Permalink builder — the slice never knows the consumer's URL shape. */
  postHref: (postId: string) => string;
  profileHref: (username: string) => string;
  /** Where a stranger goes to earn the composer and the like button. */
  loginHref: string;
  copy?: PostsCopyOverride;
  className?: string;
};

export function FeedView({
  tenantId,
  initialPosts = [],
  initialKind = null,
  postHref,
  profileHref,
  loginHref,
  copy: copyOverride,
  className,
}: FeedViewProps) {
  const copy = mergePostsCopy(copyOverride);
  const [kind, setKind] = useState<PostKindFilter>(initialKind);
  // Notification rows written before the boards were folded carry hrefs ending
  // in #sumber / #usulan / #pengumuman. A fragment never reaches the server, so
  // next.config.mjs cannot repair those the way it repaired the path — they
  // would land on the unfiltered feed instead of the category the notification
  // is about. Read it once on mount and open the matching chip.
  useEffect(() => {
    if (initialKind !== null) return;
    const fromHash = parsePostKind(window.location.hash.slice(1));
    if (fromHash !== null) setKind(fromHash);
  }, [initialKind]);

  const { posts: live, status, loadMore } = usePostFeed(tenantId, kind);
  // Live rows win the moment the socket answers; before that (SSR + the first
  // client render) the server page keeps the feed readable.
  const posts = live.length > 0 ? live : kind === null ? initialPosts : [];

  const { membership, isAuthenticated, isAuthLoading } = useMyMembership(tenantId);
  const isMember = membership != null;
  // membership is `undefined` while the query is in flight. Treating that as
  // "not a member" flashes the join gate at a signed-in member on every load,
  // and the gate and the composer are very different heights — so it is a wrong
  // CTA plus a layout shift. Hold a skeleton until membership actually resolves.
  const membershipPending = isAuthLoading || (isAuthenticated && membership === undefined);
  const canAnnounce = membership?.role === "instructor" || membership?.role === "owner";

  const liked = useMyLikedPostIds(posts.map((p) => p._id), isMember);
  const { create, isPending: creating } = useCreatePost(copyOverride);
  const { toggleLike, pendingId } = useToggleLike(copyOverride);

  const loadingFirst = status === "LoadingFirstPage" && posts.length === 0;

  return (
    <div className={className ? `space-y-6 ${className}` : "space-y-6"}>
      {membershipPending ? (
        <Skeleton className="h-28 w-full" />
      ) : isMember ? (
        <PostComposer
          onSubmit={(values) => create({ tenantId, ...values })}
          submitting={creating}
          canAnnounce={canAnnounce}
          copy={copyOverride}
        />
      ) : (
        // One 44px row, not a 160px dashed panel. This is a NOTICE ("reading is
        // free, writing needs an account"), not the screen's job — it used to
        // push the first post to y=404 on a 390px phone, 48% of the fold, and
        // its gold button shouted the same word as the gold Join in the sticky
        // nav bar 150px above it. Quiet link + one line: the primary action
        // stays where the nav bar already put it.
        <div className="flex min-h-11 items-center justify-between gap-3 border-b border-border pb-2">
          <p className="min-w-0 truncate text-xs text-muted-foreground">{copy.gateHint}</p>
          <Link
            href={loginHref}
            className="shrink-0 text-xs font-medium text-primary underline-offset-4 hover:underline"
          >
            {copy.gateAction}
          </Link>
        </div>
      )}

      <CategoryChips value={kind} onChange={setKind} copy={copyOverride} />

      {loadingFirst ? (
        <div className="space-y-3" aria-busy>
          <span className="sr-only">Memuat papan diskusi…</span>
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : posts.length === 0 ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyArt src="/ui/empty/diskusi.webp" />
            {/* text-xs: Press Start 2P is full-width, so EmptyTitle's default
                text-lg would overflow a phone at this string length. */}
            <EmptyTitle className="font-display">
              {kind === null ? copy.emptyTitle : copy.emptyFilteredTitle}
            </EmptyTitle>
            <EmptyDescription className="text-pretty">
              {kind === null ? copy.emptyHint : copy.emptyFilteredHint}
            </EmptyDescription>
          </EmptyHeader>
          {kind === null ? null : (
            <EmptyContent>
              <Button variant="outline" size="sm" onClick={() => setKind(null)}>
                {copy.filterAll}
              </Button>
            </EmptyContent>
          )}
        </Empty>
      ) : (
        <ul className="space-y-3">
          {posts.map((post) => (
            <li key={post._id}>
              <PostCard
                post={post}
                href={postHref(post._id)}
                authorHref={post.author ? profileHref(post.author.username) : null}
                liked={liked.has(post._id)}
                likePending={pendingId === post._id}
                canLike={isMember}
                loginHref={loginHref}
                onToggleLike={() => void toggleLike(post._id)}
                copy={copyOverride}
              />
            </li>
          ))}
        </ul>
      )}

      {posts.length > 0 && status !== "LoadingFirstPage" ? (
        <div className="flex justify-center pt-2">
          {status === "Exhausted" ? (
            <p className="eyebrow">{copy.exhausted}</p>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="min-h-11 @sm:min-h-9"
              disabled={status === "LoadingMore"}
              onClick={() => loadMore(FEED_PAGE_SIZE)}
            >
              {status === "LoadingMore" ? copy.loadingMore : copy.loadMore}
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
