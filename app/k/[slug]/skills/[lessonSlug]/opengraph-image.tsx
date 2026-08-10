import { api } from "@convex/_generated/api";
import type { PublicMateri } from "@/features/materi";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

// Per-skill social card — the unfurl a shared skill link produces in WhatsApp,
// which is how these links actually travel.
//
// THE PROMPT IS NOT ON IT, and cannot be: `publicGetBySlug` is the anonymous
// etalase projection and has no `promptText` field to read. An OG image is
// served to anyone who can guess the URL and is cached by every chat app that
// touches it — putting the prompt there would be the same leak as putting it
// in the HTML, minus the audit trail.
//
// ONE etalase read (it already carries the tenant name). safeQuery never
// throws, so a draft, a deleted skill or a Convex outage still gets a branded
// card instead of a broken image.
export const alt = "Skill";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  // Annotated, not inferred — see the note on the same read in ./page.tsx.
  const skill: PublicMateri | null = await safeQuery(
    api.features.materi.queries.publicGetBySlug,
    { tenantSlug: slug, lessonSlug }
  );

  // Tags, not courses: a skill usually sits in no course at all, and its tags
  // are the only thing that says what it is FOR without quoting the prompt.
  const subtitle = skill === null ? undefined : skill.tags.slice(0, 3).join(" · ") || undefined;

  return ogCard({
    eyebrow: skill === null ? "Skill" : `${skill.tenant.name} · Skill`,
    title: skill?.title ?? "Skill",
    subtitle,
  });
}
