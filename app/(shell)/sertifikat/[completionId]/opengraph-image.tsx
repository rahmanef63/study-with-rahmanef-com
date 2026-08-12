import { api } from "@convex/_generated/api";
import { ogCard, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/og";
import { safeQuery } from "@/lib/convex-server";

export const alt = "Sertifikat penyelesaian kelas";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image({
  params,
}: {
  params: Promise<{ completionId: string }>;
}) {
  const { completionId } = await params;
  const cert = await safeQuery(api.features.profiles.public.publicGetCertificate, {
    completionId,
  });
  // safeQuery never throws, so an unknown id or a Convex outage still renders a
  // valid card instead of failing the image route.
  return ogCard({
    eyebrow: "Sertifikat penyelesaian",
    title: cert?.courseTitle ?? "Sertifikat",
    subtitle: cert ? `${cert.displayName} · ${cert.tenantName}` : undefined,
  });
}
