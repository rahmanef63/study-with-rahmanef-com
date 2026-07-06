import { PublicProfileView } from "@/features/profiles";

// #9 mount — profil publik + badge wall (anonymous etalase per AGENTS.md §6).
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://study-with.rahmanef.com";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <PublicProfileView username={username} shareUrl={`${SITE_URL}/u/${username}`} />
    </div>
  );
}
