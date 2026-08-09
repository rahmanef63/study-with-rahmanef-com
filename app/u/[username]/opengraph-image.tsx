import { api } from "@convex/_generated/api";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

export const alt = "Profil belajar";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const profile = await safeQuery(api.features.profiles.public.publicGetByUsername, {
    username,
  });
  return ogCard({
    eyebrow: "Profil",
    title: profile?.displayName ?? `@${username}`,
    subtitle: profile ? `@${profile.username}` : undefined,
  });
}
