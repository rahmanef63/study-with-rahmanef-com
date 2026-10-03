// courses slice — YouTube helpers.
// The SERVER is the security gate (convex/features/courses/validate.ts
// rejects anything that isn't an 11-char ID). These helpers are UX sugar:
// let an instructor paste a full URL into the form and extract the ID
// client-side before submitting.
export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;
import { parseYoutubeSource } from "@/features/markdown";

export function isValidYoutubeVideoId(value: string): boolean {
  return YOUTUBE_ID_RE.test(value);
}

/**
 * Extract an 11-char video ID from a pasted URL or raw ID.
 * Returns null when nothing safe can be extracted (caller shows the
 * validation hint; the server would reject it anyway).
 */
export function extractYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (isValidYoutubeVideoId(trimmed)) return trimmed;
  return parseYoutubeSource(trimmed)?.videoId ?? null;
}

/**
 * Embed URL on the fixed youtube-nocookie.com origin — the ID is validated,
 * the origin is constant, so no arbitrary-domain embed is possible.
 */
export function buildYoutubeEmbedUrl(videoId: string): string | null {
  if (!isValidYoutubeVideoId(videoId)) return null;
  return `https://www.youtube-nocookie.com/embed/${videoId}`;
}

/** Watch URL for the "Tonton di YouTube" fallback link. */
export function buildYoutubeWatchUrl(videoId: string): string | null {
  if (!isValidYoutubeVideoId(videoId)) return null;
  return `https://www.youtube.com/watch?v=${videoId}`;
}
