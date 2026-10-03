"use client";
import { useEffect, useState } from "react";
import type { YoutubeMetadata } from "@/features/markdown";

const cached = new Map<string, { at: number; value: YoutubeMetadata | null }>();
const pending = new Map<string, Promise<YoutubeMetadata | null>>();
async function read(videoId: string): Promise<YoutubeMetadata | null> {
  const item = cached.get(videoId);
  if (item && Date.now() - item.at < (item.value ? 3_600_000 : 60_000)) return item.value;
  if (pending.has(videoId)) return pending.get(videoId)!;
  const request = fetch(`/api/media/youtube?id=${encodeURIComponent(videoId)}`, { signal: AbortSignal.timeout(5000) })
    .then(async response => {
      if (!response.ok) return null;
      const value: unknown = await response.json();
      if (!value || typeof value !== "object") return null;
      const raw = value as Record<string, unknown>;
      if (raw.videoId !== videoId || typeof raw.title !== "string") return null;
      return { videoId, title: raw.title.slice(0, 300), ...(typeof raw.channelName === "string" ? { channelName: raw.channelName.slice(0, 120) } : {}), ...(typeof raw.thumbnailUrl === "string" ? { thumbnailUrl: raw.thumbnailUrl } : {}) };
    }).catch(() => null).then(value => {
      if (cached.size >= 200) cached.delete(cached.keys().next().value!);
      cached.set(videoId, { at: Date.now(), value });
      return value;
    }).finally(() => pending.delete(videoId));
  pending.set(videoId, request);
  return request;
}
/** Optional metadata: bounded, deduplicated, no persisted account data. */
export function useYoutubeMetadata(videoIds: readonly string[]) {
  const key = [...new Set(videoIds)].filter(id => /^[A-Za-z0-9_-]{11}$/.test(id)).slice(0, 10).sort().join(",");
  const [result, setResult] = useState<{ key: string; data: Record<string, YoutubeMetadata> }>({ key: "", data: {} });
  useEffect(() => {
    if (!key) return;
    let active = true;
    void Promise.all(key.split(",").map(read)).then(values => {
      if (active) setResult({ key, data: Object.fromEntries(values.filter((v): v is YoutubeMetadata => v !== null).map(v => [v.videoId, v])) });
    });
    return () => { active = false; };
  }, [key]);
  return result.key === key ? result.data : {};
}
