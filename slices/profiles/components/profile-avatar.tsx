"use client";

// Avatar for the public profile. Remote avatar hosts are arbitrary (Google,
// gravatar, user-supplied) and the project has no next/image `remotePatterns`
// allowlist configured (integrator-only, next.config.mjs), so — exactly like
// slices/courses/components/course-card.tsx — the image renders as a
// background-image div rather than next/image. The URL is CSS-escaped via
// JSON.stringify to prevent style-injection. No URL → initials fallback.
// TODO(rr): propose remotePatterns to alpha, then upgrade to a shared <Avatar>.
import { cn } from "@/lib/utils";

export type ProfileAvatarProps = {
  name: string;
  avatarUrl?: string | null;
  /** Rendered square size in px (default 96). */
  size?: number;
  className?: string;
};

/** First letters of up to two name words, uppercased ("Rahman Ef" → "RE"). */
function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ProfileAvatar({ name, avatarUrl, size = 96, className }: ProfileAvatarProps) {
  const base = "shrink-0 rounded-full border border-border bg-muted bg-cover bg-center";

  if (avatarUrl) {
    return (
      <div
        role="img"
        aria-label={name}
        style={{ width: size, height: size, backgroundImage: `url(${JSON.stringify(avatarUrl)})` }}
        className={cn(base, className)}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className={cn(
        base,
        "flex items-center justify-center font-semibold text-muted-foreground",
        className
      )}
    >
      {deriveInitials(name)}
    </div>
  );
}
