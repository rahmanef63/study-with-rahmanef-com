"use client";

import Link from "next/link";
import type { Id } from "@convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { useMyMembership } from "@/features/tenants";

/** Shows the manage entry only to instructor+/owner (server still enforces). */
export function KelolaLink({ tenantId, slug }: { tenantId: Id<"tenants">; slug: string }) {
  const { membership } = useMyMembership(tenantId);
  if (membership?.role !== "instructor" && membership?.role !== "owner") return null;
  return (
    <Button asChild variant="outline" size="sm">
      <Link href={`/t/${slug}/kelola/kelas`}>Kelola kelas</Link>
    </Button>
  );
}
