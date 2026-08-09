"use client";

// Client island purely so the `certificateHref` builder can exist: a function
// prop cannot cross the server→client boundary ("Functions cannot be passed
// directly to Client Components"), and PublicProfileView takes one so the slice
// never hardcodes a route.
import { PublicProfileView } from "@/features/profiles";
import { communityHref } from "@/lib/community";
import { absoluteUrl } from "@/lib/site";

export function ProfilView({ username }: { username: string }) {
  return (
    <PublicProfileView
      username={username}
      shareUrl={absoluteUrl(communityHref.profile(username))}
      certificateHref={(completionId) => `/sertifikat/${completionId}`}
    />
  );
}
