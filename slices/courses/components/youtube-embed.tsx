"use client";
import { MarkdownMediaProvider, YoutubeMarkdownEmbed } from "@/features/markdown";
import { useYoutubeMetadata } from "../hooks/use-youtube-metadata";
export type YoutubeEmbedProps = { videoId: string; title: string; className?: string };
export function YoutubeEmbed({ videoId, title, className }: YoutubeEmbedProps) {
  const metadata = useYoutubeMetadata([videoId]);
  return <div className={className}><MarkdownMediaProvider youtubeMetadata={metadata}><YoutubeMarkdownEmbed videoId={videoId} title={title} /></MarkdownMediaProvider></div>;
}
