import { api } from "@convex/_generated/api";
import type { PublicMateri } from "@/features/materi";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

// Per-materi social card — the unfurl a shared materi link produces in
// WhatsApp, which is how these links actually travel.
//
// ONE etalase read (publicGetBySlug already carries the tenant name, so there
// is no second query to make). safeQuery never throws, so a draft, a deleted
// materi or a Convex outage still gets a branded card instead of a broken
// image.
export const alt = "Materi";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string; lessonSlug: string }>;
}) {
  const { slug, lessonSlug } = await params;
  // Annotated, not inferred — see the note on the same read in ./page.tsx.
  const materi: PublicMateri | null = await safeQuery(
    api.features.materi.queries.publicGetBySlug,
    { tenantSlug: slug, lessonSlug }
  );

  // Subtitle earns its place: which courses teach this materi is the one fact
  // that explains what the page is, and it is the feature the model exists for.
  const courses = materi?.courses.map((course) => course.title) ?? [];
  const subtitle =
    courses.length > 0
      ? `Dipakai di ${courses.slice(0, 2).join(" · ")}${courses.length > 2 ? ` +${courses.length - 2}` : ""}`
      : materi === null
        ? undefined
        : materi.tags.slice(0, 3).join(" · ") || undefined;

  return ogCard({
    eyebrow: materi === null ? "Materi" : `${materi.tenant.name} · Materi`,
    title: materi?.title ?? "Materi",
    subtitle,
  });
}
