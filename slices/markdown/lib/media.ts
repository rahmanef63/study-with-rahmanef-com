/** Author content is untrusted even when the editor is restricted to instructors. */
export function safeMarkdownUrl(value: string, image = false): string | null {
  const text = value.trim();
  if (!text || /[\u0000-\u0020\u007f\\]/u.test(text)) return null;
  if (text.startsWith("/") && !text.startsWith("//")) return text;
  if (!image && text.startsWith("#")) return text;
  try {
    const url = new URL(text);
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password ? text : null;
  } catch { return null; }
}

export type YoutubeSource = { videoId: string; startSeconds?: number };
export type YoutubeMetadata = { videoId: string; title: string; channelName?: string; thumbnailUrl?: string };
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
/** Pin host equality; strings such as evil-youtube.com must never become embeds. */
export function parseYoutubeSource(value: string): YoutubeSource | null {
  const safe = safeMarkdownUrl(value);
  if (!safe || !/^https?:\/\//i.test(safe)) return null;
  const url = new URL(safe);
  const host = url.hostname.toLowerCase();
  const youtube = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host);
  const parts = url.pathname.split("/").filter(Boolean);
  const videoId = host === "youtu.be" ? parts[0] : youtube && url.pathname === "/watch" ? url.searchParams.get("v") : youtube && ["embed", "shorts", "live"].includes(parts[0]) ? parts[1] : null;
  if (!videoId || !VIDEO_ID.test(videoId) || url.port) return null;
  const time = url.searchParams.get("start") ?? url.searchParams.get("t");
  let startSeconds: number | undefined;
  if (time && /^\d+$/.test(time)) startSeconds = Number(time);
  else if (time && /^(?:\d+h)?(?:\d+m)?(?:\d+s)?$/.test(time)) {
    const match = time.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)!;
    startSeconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  }
  return { videoId, ...(startSeconds && Number.isSafeInteger(startSeconds) && startSeconds <= 86400 ? { startSeconds } : {}) };
}

/** Normalize only the explicit safe YouTube forms; raw HTML never reaches React. */
export function youtubeFromLine(line: string): (YoutubeSource & { title?: string }) | null {
  const directive = line.match(/^:::embed\s+(\S+)\s*$/);
  const link = line.match(/^\[([^\]]*)\]\((https?:\/\/\S+)\)\s*$/);
  const auto = line.match(/^<(https?:\/\/[^>]+)>$/);
  const iframe = line.match(/^<iframe\b([^>]*)>\s*<\/iframe>$/i);
  const attributes = iframe?.[1];
  const src = attributes?.match(/\bsrc\s*=\s*["']([^"']+)["']/i)?.[1]?.replace(/&amp;/g, "&");
  const title = attributes?.match(/\btitle\s*=\s*["']([^"']+)["']/i)?.[1];
  const source = parseYoutubeSource(directive?.[1] ?? link?.[2] ?? auto?.[1] ?? src ?? line);
  return source ? { ...source, ...((link?.[1] || title) ? { title: link?.[1] || title } : {}) } : null;
}

/** Host can batch metadata reads without fetching from the presentation slice. */
export function collectYoutubeSources(nodes: readonly import("./parse").MdNode[]): YoutubeSource[] {
  const sources = new Map<string, YoutubeSource>();
  const walk = (items: readonly import("./parse").MdNode[]) => {
    for (const item of items) {
      if (item.type === "youtube") { const source = parseYoutubeSource(`https://youtu.be/${item.videoId}`); if (source) sources.set(source.videoId, source); }
      else if (item.type === "toggle") walk(item.children);
    }
  };
  walk(nodes);
  return [...sources.values()];
}
