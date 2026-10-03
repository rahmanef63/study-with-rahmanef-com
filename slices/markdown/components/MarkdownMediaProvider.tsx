"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { YoutubeMetadata } from "../lib/media";

const YoutubeMetadataContext = createContext<Readonly<Record<string, YoutubeMetadata>>>({});
export type MarkdownMediaProviderProps = { children: ReactNode; youtubeMetadata?: Readonly<Record<string, YoutubeMetadata>> };
/** Host owns metadata collection and fetch policy; the portable renderer never fetches. */
export function MarkdownMediaProvider({ children, youtubeMetadata = {} }: MarkdownMediaProviderProps) {
  return <YoutubeMetadataContext.Provider value={youtubeMetadata}>{children}</YoutubeMetadataContext.Provider>;
}
export function useYoutubeMarkdownMetadata(videoId: string) { return useContext(YoutubeMetadataContext)[videoId]; }
