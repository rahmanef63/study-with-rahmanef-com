"use client";
// posts slice — one row of the Diskusi feed. Props-driven: every href is passed
// in (the slice never knows the consumer's URL shape), and every gate is UX —
// toggleLike re-checks membership server-side.
//
// Deliberately NOT rendered here: the YouTube embed. A feed of autoplaying-
// capable iframes is a scroll killer; the embed lives on the permalink only.
import Link from "next/link";
import { Heart, Link2, MessageSquare, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { mergePostsCopy, type PostsCopyOverride } from "../config/copy";
import { postKindLabel, postKindTone } from "../lib/kind";
import { formatRelativeTime, toIsoDate } from "../lib/time";
import type { PublicPost } from "../types";
import { PostBody } from "./post-body";

export type PostCardProps = {
  post: PublicPost;
  /** Permalink for this post. */
  href: string;
  /** Author's public profile, or null when the author has no profile row. */
  authorHref: string | null;
  liked: boolean;
  likePending?: boolean;
  /** Viewer may like (member). False renders the login CTA instead. */
  canLike: boolean;
  /** Where a non-member is sent to earn the like button. */
  loginHref: string;
  onToggleLike?: () => void;
  copy?: PostsCopyOverride;
};

export function PostCard({
  post,
  href,
  authorHref,
  liked,
  likePending = false,
  canLike,
  loginHref,
  onToggleLike,
  copy: copyOverride,
}: PostCardProps) {
  const copy = mergePostsCopy(copyOverride);
  const authorName = post.author?.displayName ?? copy.anonymousAuthor;

  return (
    <Card className="gap-3 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={cn(
              "eyebrow border px-2 py-0.5",
              postKindTone(post.kind)
            )}
          >
            {postKindLabel(post.kind, copy)}
          </span>
          {post.pinned ? (
            <span className="inline-flex items-center gap-1 border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
              <Pin className="size-3" aria-hidden />
              {copy.pinned}
            </span>
          ) : null}
          {/* suppressHydrationWarning: the SSR'd first page renders "3 menit
              lalu" against the server clock and hydrates against the browser's.
              The dateTime attribute is the stable, machine-readable value. */}
          <time
            dateTime={toIsoDate(post.createdAt)}
            className="text-muted-foreground"
            suppressHydrationWarning
          >
            {formatRelativeTime(post.createdAt)}
          </time>
        </div>

        <h3 className="text-pretty text-base font-semibold leading-snug [overflow-wrap:anywhere]">
          {/* Below md the link is a full-width 44px block, not an inline run of
              text: a one-line title was a 19px target and the author link below
              was 14px, both well under the touch floor. `max-md:` so the
              desktop card keeps its inline heading and its exact density. */}
          <Link
            href={href}
            className="hover:text-primary hover:underline underline-offset-4 max-md:flex max-md:min-h-11 max-md:items-center"
          >
            {post.title}
          </Link>
        </h3>

        <PostBody bodyMd={post.bodyMd} excerpt />

        {post.linkUrl ? (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 truncate text-sm text-accent underline underline-offset-4 hover:text-primary"
          >
            <Link2 className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{post.linkUrl}</span>
          </a>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
          <span className="min-w-0 truncate">
            {authorHref ? (
              // leading-[44px] rather than min-h-11: an inline-block whose
              // height IS its line box keeps `truncate` working on the parent
              // span, and the footer row is already 44px tall (the like and
              // comment buttons are min-h-11), so nothing grows.
              <Link
                href={authorHref}
                className="text-foreground hover:text-primary hover:underline max-md:inline-block max-md:leading-[44px]"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-foreground">{authorName}</span>
            )}
          </span>

          <span className="flex items-center gap-1">
            {canLike ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={likePending}
                aria-pressed={liked}
                aria-label={liked ? copy.liked : copy.like}
                onClick={onToggleLike}
                className={cn("gap-1.5 px-2 min-h-11 @sm:min-h-9", liked && "text-primary")}
              >
                <Heart className={cn("size-3.5", liked && "fill-current")} aria-hidden />
                <span className="tabular-nums">{post.likeCount}</span>
              </Button>
            ) : (
              <Button variant="ghost" size="sm" asChild className="gap-1.5 px-2 min-h-11 @sm:min-h-9">
                <Link href={loginHref} title={copy.loginToLike} aria-label={copy.loginToLike}>
                  <Heart className="size-3.5" aria-hidden />
                  <span className="tabular-nums">{post.likeCount}</span>
                </Link>
              </Button>
            )}

            <Button variant="ghost" size="sm" asChild className="gap-1.5 px-2 min-h-11 @sm:min-h-9">
              <Link href={href} aria-label={`${post.commentCount} ${copy.commentCountLabel}`}>
                <MessageSquare className="size-3.5" aria-hidden />
                <span className="tabular-nums">{post.commentCount}</span>
              </Link>
            </Button>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
