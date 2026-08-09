import type { Metadata } from "next";
import { cache, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Heart, Link2, MessageSquare, Pin } from "lucide-react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { YoutubeEmbed } from "@/features/courses";
import { PostBody, postKindLabel, postKindTone, POSTS_COPY, toExcerpt } from "@/features/posts";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { communityHref } from "@/lib/community";
import { safeQuery } from "@/lib/convex-server";
import { absoluteUrl } from "@/lib/site";
import { PostReplies } from "./_components/post-replies";

// Post permalink — the shareable, indexable unit of the Diskusi feed (#29).
// publicGetPost is on the anonymous etalase whitelist (AGENTS.md §6), so the
// title, body and author are real HTML for a crawler and for a logged-out
// recipient of the link. Only the REPLIES are member-gated (client island).
type Params = { slug: string; postId: string };

// cache(): generateMetadata, the OG-less <head>, and the body all want the same
// row; fetchQuery has no per-request dedupe of its own.
const getPost = cache(async (postId: string) =>
  safeQuery(api.features.posts.queries.publicGetPost, { postId: postId as Id<"posts"> })
);
const getTenant = cache(async (slug: string) =>
  safeQuery(api.features.tenants.queries.getPublicBySlug, { slug })
);

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { slug, postId } = await params;
  const post = await getPost(postId);
  const path = communityHref.post(slug, postId);
  if (post === null) {
    // Deleted, unknown, or unreachable — never guess a title from the id.
    return { title: "Post", alternates: { canonical: path }, robots: { index: false } };
  }
  const description = toExcerpt(post.bodyMd, 200);
  return {
    title: post.title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "article",
      title: post.title,
      description,
      url: absoluteUrl(path),
    },
    twitter: { card: "summary_large_image", title: post.title, description },
  };
}

async function PostSurface({ slug, postId }: Params) {
  const [post, tenant] = await Promise.all([getPost(postId), getTenant(slug)]);
  // publicGetPost answers null for unknown AND soft-deleted rows, by design.
  if (post === null) notFound();

  const path = communityHref.post(slug, postId);
  const authorName = post.author?.displayName ?? POSTS_COPY.anonymousAuthor;

  return (
    <article className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={cn("eyebrow border px-2 py-0.5 text-[10px]", postKindTone(post.kind))}>
          {postKindLabel(post.kind, POSTS_COPY)}
        </span>
        {post.pinned ? (
          <span className="inline-flex items-center gap-1 border border-primary/50 bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
            <Pin className="size-3" aria-hidden />
            {POSTS_COPY.pinned}
          </span>
        ) : null}
        <time dateTime={new Date(post.createdAt).toISOString()} className="text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </time>
      </div>

      <h1 className="text-balance text-base @sm:text-lg [overflow-wrap:anywhere]">{post.title}</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border py-3 text-sm">
        <span className="text-muted-foreground">
          Ditulis oleh{" "}
          {post.author ? (
            <Link
              href={communityHref.profile(post.author.username)}
              className="text-foreground hover:text-primary hover:underline"
            >
              {authorName}
            </Link>
          ) : (
            <span className="text-foreground">{authorName}</span>
          )}
        </span>
        <span className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Heart className="size-3.5" aria-hidden />
            <span className="tabular-nums">{post.likeCount}</span>
            <span className="sr-only">{POSTS_COPY.likeCountLabel}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageSquare className="size-3.5" aria-hidden />
            <span className="tabular-nums">{post.commentCount}</span>
            <span className="sr-only">{POSTS_COPY.commentCountLabel}</span>
          </span>
          <TombolBagikan url={absoluteUrl(path)} title={post.title} variant="ghost" />
        </span>
      </div>

      {post.youtubeVideoId ? (
        <YoutubeEmbed videoId={post.youtubeVideoId} title={post.title} />
      ) : null}

      <PostBody bodyMd={post.bodyMd} />

      {post.linkUrl ? (
        <a
          href={post.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex max-w-full items-center gap-1.5 border-2 border-border px-3 py-2 text-sm text-accent shadow-[3px_3px_0_0_var(--pixel-shadow)] hover:border-primary hover:text-primary"
        >
          <Link2 className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{post.linkUrl}</span>
        </a>
      ) : null}

      {tenant === null ? null : (
        <section className="border-t border-border pt-6">
          <PostReplies
            tenantId={tenant._id}
            postId={postId as Id<"posts">}
            backHref={path}
          />
        </section>
      )}
    </article>
  );
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { slug, postId } = await params;
  return (
    <div className="@container mx-auto w-full max-w-3xl space-y-6">
      <Link
        href={communityHref.diskusi(slug)}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Kembali ke Diskusi
      </Link>
      {/* Own boundary: the awaited etalase reads are dynamic (cacheComponents). */}
      <Suspense
        fallback={
          <div className="space-y-4" aria-busy>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        }
      >
        <PostSurface slug={slug} postId={postId} />
      </Suspense>
    </div>
  );
}
