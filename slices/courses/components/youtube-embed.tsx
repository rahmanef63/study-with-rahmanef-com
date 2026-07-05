// courses slice — YouTube lesson video.
// Origin is FIXED to youtube-nocookie.com and the ID is re-validated here,
// so even a corrupt DB value cannot produce an arbitrary-domain iframe.
import { buildYoutubeEmbedUrl } from "../lib/youtube";

export type YoutubeEmbedProps = {
  videoId: string;
  /** Accessible iframe title — pass the lesson title. */
  title: string;
  className?: string;
};

export function YoutubeEmbed({ videoId, title, className }: YoutubeEmbedProps) {
  const src = buildYoutubeEmbedUrl(videoId);
  if (src === null) return null; // invalid ID → render nothing, never a broken embed
  return (
    <div
      className={
        className
          ? `aspect-video overflow-hidden rounded-lg border border-border bg-muted ${className}`
          : "aspect-video overflow-hidden rounded-lg border border-border bg-muted"
      }
    >
      <iframe
        src={src}
        title={title}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        loading="lazy"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}
