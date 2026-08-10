import type { Metadata } from "next";
import { cache, Suspense } from "react";
import { api } from "@convex/_generated/api";
import { TombolBagikan } from "@/components/tombol-bagikan";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfilView } from "./profil-view";
import { absoluteUrl, safeQuery } from "@/lib/convex-server";
import { communityHref } from "@/lib/community";

// Public profile + badge wall — a REAL route (the OS served this as
// /profil/<username>, a window with no metadata and no server HTML).
// publicGetByUsername is on the anonymous etalase whitelist (AGENTS.md §6).
type Params = { username: string };

// SSOT for internal hrefs (lib/community.ts).
const profilePath = communityHref.profile;

// cache(): generateMetadata, the server block and the OG route all need the
// same read; fetchQuery does not dedupe per request.
const getProfile = cache(async (username: string) =>
 safeQuery(api.features.profiles.public.publicGetByUsername, { username })
);

export async function generateMetadata({
 params,
}: {
 params: Promise<Params>;
}): Promise<Metadata> {
 const { username } = await params;
 const profile = await getProfile(username);
 if (profile === null) {
 return { title: "Profil tidak ditemukan", robots: { index: false } };
  }
 const title = `${profile.displayName} (@${profile.username})`;
 const description =
 profile.bio ?? `Profil ${profile.displayName} di belajar-with-rahmanef.com.`;
 return {
 title,
 description,
 alternates: { canonical: profilePath(profile.username) },
 openGraph: { type: "profile", title, description, url: profilePath(profile.username) },
 twitter: { card: "summary_large_image", title, description },
  };
}

async function ProfileHeading({ username }: { username: string }) {
 const profile = await getProfile(username);
 if (profile === null) return null;
 return (
    <header className="mb-6 space-y-2">
      <h1 className="font-display text-lg @sm:text-xl">{profile.displayName}</h1>
      <p className="text-muted-foreground">@{profile.username}</p>
      {profile.bio ? <p className="text-pretty text-muted-foreground">{profile.bio}</p> : null}
      <div className="pt-1">
        <TombolBagikan
 url={absoluteUrl(profilePath(profile.username))}
 title={`${profile.displayName} (@${profile.username})`}
        />
      </div>
    </header>
  );
}

export default async function ProfilPublikPage({ params }: { params: Promise<Params> }) {
 const { username } = await params;
 return (
    <main className="mx-auto w-full max-w-2xl px-6 py-12">
      <Suspense fallback={<Skeleton className="mb-6 h-24 w-full " />}>
        <ProfileHeading username={username} />
      </Suspense>
      <ProfilView username={username} />
    </main>
  );
}
