"use client";
import { ExternalLink } from "lucide-react";
import { parseYoutubeSource, safeMarkdownUrl } from "../lib/media";
import { useYoutubeMarkdownMetadata } from "./MarkdownMediaProvider";

export type YoutubeMarkdownEmbedProps = { videoId: string; title?: string; startSeconds?: number };
export function YoutubeMarkdownEmbed({ videoId, title: authoredTitle, startSeconds }: YoutubeMarkdownEmbedProps) {
  const supplied = useYoutubeMarkdownMetadata(videoId);
  const source = parseYoutubeSource(`https://youtu.be/${videoId}${startSeconds ? `?start=${startSeconds}` : ""}`);
  if (!source) return null;
  const metadata = supplied?.videoId === source.videoId ? supplied : undefined;
  const title = metadata?.title || authoredTitle || "Video YouTube";
  const watchUrl = `https://www.youtube.com/watch?v=${source.videoId}${source.startSeconds ? `&t=${source.startSeconds}s` : ""}`;
  const embedUrl = `https://www.youtube-nocookie.com/embed/${source.videoId}${source.startSeconds ? `?start=${source.startSeconds}` : ""}`;
  const thumbnail = metadata?.thumbnailUrl && safeMarkdownUrl(metadata.thumbnailUrl, true);
  const thumbnailUrl = thumbnail && /^https:\/\//i.test(thumbnail) && new URL(thumbnail).hostname === "i.ytimg.com" && new URL(thumbnail).pathname.startsWith(`/vi/${source.videoId}/`) ? thumbnail : null;
  return <figure className="my-5 min-w-0 space-y-3">
    <div className="aspect-video w-full overflow-hidden rounded-md border border-border bg-muted"><iframe src={embedUrl} title={title} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="h-full w-full border-0" /></div>
    <figcaption className="flex min-w-0 items-center gap-3">
      {thumbnailUrl ? (
        // Fixed-host external thumbnail; unoptimized next/image offers no optimization here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={thumbnailUrl} alt="" width={80} height={48} loading="lazy" className="h-12 w-20 shrink-0 rounded object-cover" />
      ) : null}
      <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{title}</p>{metadata?.channelName ? <p className="break-words text-xs text-muted-foreground">{metadata.channelName}</p> : null}</div>
      <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 shrink-0 items-center gap-1 text-xs text-primary hover:underline focus-visible:outline-2 focus-visible:outline-ring"><span className="sr-only sm:not-sr-only">Buka di YouTube</span><ExternalLink aria-hidden="true" className="size-4" /><span className="sm:hidden">YouTube</span></a>
    </figcaption>
  </figure>;
}
