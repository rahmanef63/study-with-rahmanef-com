import type { YoutubeMetadata } from "../../slices/markdown/lib/media";
export const fixtureVideoId = "dQw4w9WgXcQ";
export const fixtureYoutubeMetadata: Readonly<Record<string, YoutubeMetadata>> = {
  [fixtureVideoId]: { videoId: fixtureVideoId, title: "Judul metadata fixture lokal", channelName: "Channel uji lokal", thumbnailUrl: `https://i.ytimg.com/vi/${fixtureVideoId}/hqdefault.jpg` },
};
/** Only this fixture aliases the course metadata transport; no request is simulated. */
export function useYoutubeMetadata(ids: readonly string[]) {
  return Object.fromEntries(ids.flatMap(id => fixtureYoutubeMetadata[id] ? [[id, fixtureYoutubeMetadata[id]]] : []));
}
