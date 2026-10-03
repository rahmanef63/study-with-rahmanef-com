"use client";
import { useMemo } from "react";
import { collectYoutubeSources, MarkdownMediaProvider, parseMarkdown, renderNodes } from "@/features/markdown";
import { cn } from "@/lib/utils";
import { useYoutubeMetadata } from "../hooks/use-youtube-metadata";
export type MarkdownViewProps = { content: string; className?: string };
/** Shared read surface: initial prose is SSR; metadata enhances safe media. */
export function MarkdownView({ content, className }: MarkdownViewProps) {
  const nodes = useMemo(() => parseMarkdown(content), [content]);
  const metadata = useYoutubeMetadata(collectYoutubeSources(nodes).map(source => source.videoId));
  return <MarkdownMediaProvider youtubeMetadata={metadata}><div className={cn("min-w-0 space-y-4 leading-relaxed [overflow-wrap:anywhere]", className)}>{renderNodes(nodes)}</div></MarkdownMediaProvider>;
}
