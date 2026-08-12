"use client";

// Avatar for the public profile. Remote avatar hosts are arbitrary (Google,
// gravatar, user-supplied) and the project has no next/image `remotePatterns`
// allowlist configured (integrator-only, next.config.mjs), so — exactly like
// slices/courses/components/course-card.tsx — the image renders as a
// background-image div rather than next/image. The URL is CSS-escaped via
// JSON.stringify to prevent style-injection. No URL → initials fallback.
// TODO(rr): propose remotePatterns to alpha, then upgrade to a shared <Avatar>.
//
// THE NO-URL FALLBACK STAYS INITIALS. `public/profiles/avatar-default.png` was
// reviewed for this slot and REJECTED. It is a real file and a real default; it
// is still the wrong one here, for four reasons, in order of weight:
//
//  1. It identifies nobody. Initials are derived from the person — "Rahman Ef"
//     is RE and nobody else on the roster is. The two call sites that matter
//     are LISTS: anggota-member-row (size 36) and peringkat/baris-skor (size
//     32). A roster of eight members with no avatar becomes eight copies of the
//     identical bust, which is not a fallback, it is a wall of noise you have
//     to read past. Eight distinct two-letter tiles you can actually scan.
//  2. Nothing survives the size. The art is a 512px bust; at 32-36px the head
//     is ~8px. Measured, the whole file is two colours — #33477e on #071536 —
//     so downscaled it is a blue blob on a blue square. Two glyphs at 12-14px
//     carry far more per pixel.
//  3. The colours are not ours. That #071536 field is a hardcoded navy; the
//     tile it would sit in is `bg-muted`, which resolves to #1b2331. A P0 here
//     is tokens-only, and a baked hex cannot follow a token. The initials tile
//     already paints itself in bg-muted/text-muted-foreground and always will.
//  4. It costs a request to say less. The initials path is zero bytes over the
//     wire and renders on first paint with no decode.
//
// The image would win if we had no name to derive from — we always do; `name`
// is required, and the call sites pass a resolved displayName/username with
// "Anggota" as the floor. So avatar-default.png stays unwired. If a future
// surface needs a person-less placeholder (a skeleton, a seat in an invite
// list), that is where it belongs, not here.
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
  const base = "shrink-0 border border-border bg-muted bg-cover bg-center";

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
