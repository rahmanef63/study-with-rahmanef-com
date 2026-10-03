import { boundedJson } from "../convex/features/traffic/policy";

export type VideoMetadata = { videoId: string; title: string; channelName?: string; thumbnailUrl?: string };
const cache = new Map<string, { expires: number; value: VideoMetadata | null }>();
const pending = new Map<string, Promise<VideoMetadata | null>>();
let windowStart = 0;
let requests = 0;
export async function loadYoutubeMetadata(videoId: string): Promise<VideoMetadata | null> {
  if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) return null;
  const now = Date.now();
  const stored = cache.get(videoId);
  if (stored && stored.expires > now) return stored.value;
  if (pending.has(videoId)) return pending.get(videoId)!;
  if (now - windowStart >= 60_000) { windowStart = now; requests = 0; }
  if (++requests > 60) return null;
  const read = fetchMetadata(videoId).then(value => {
    if (cache.size >= 200) cache.delete(cache.keys().next().value!);
    cache.set(videoId, { expires: Date.now() + (value ? 21_600_000 : 60_000), value });
    return value;
  }).finally(() => pending.delete(videoId));
  pending.set(videoId, read);
  return read;
}
async function fetchMetadata(videoId: string): Promise<VideoMetadata | null> {
  try {
    const endpoint = new URL("https://www.youtube.com/oembed");
    endpoint.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
    endpoint.searchParams.set("format", "json");
    const response = await fetch(endpoint, { redirect: "error", signal: AbortSignal.timeout(4000), cache: "no-store" });
    if (!response.ok) return null;
    const raw = await boundedJson(new Request("https://metadata.invalid", { method: "POST", body: response.body, duplex: "half" } as RequestInit), 16_384);
    if (!raw || typeof raw !== "object") return null;
    const item = raw as Record<string, unknown>;
    if (item.provider_name !== "YouTube" || typeof item.title !== "string" || !item.title.trim()) return null;
    return { videoId, title: item.title.slice(0, 300), ...(typeof item.author_name === "string" ? { channelName: item.author_name.slice(0, 120) } : {}), thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` };
  } catch { return null; }
}
