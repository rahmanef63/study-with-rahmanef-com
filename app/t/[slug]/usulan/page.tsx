"use client";

import { use } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SuggestionBoxView } from "@/features/resources";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";

// #7 mount — kotak usulan kelas/topik per komunitas.
export default function UsulanPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const tenant = useTenantBySlug(slug);
  const { membership } = useMyMembership(tenant?._id);
  if (tenant === undefined) return <Skeleton className="mx-auto my-10 h-64 max-w-4xl" />;
  if (tenant === null) return null;
  const canModerate = membership?.role === "instructor" || membership?.role === "owner";
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <SuggestionBoxView tenantId={tenant._id} canModerate={canModerate} />
    </div>
  );
}
