"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCurrentProfile } from "@/features/profiles";

// Auth-aware hero CTA row. While auth is loading, isAuthenticated is false,
// so we render the signed-out CTA by default — same markup either way, no shift.
export function HeroCta() {
  const { isAuthenticated } = useCurrentProfile();
  const primary = isAuthenticated
    ? { href: "/komunitas-saya", label: "Lanjut belajar" }
    : { href: "/login", label: "Mulai belajar" };

  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild size="lg">
        <Link href={primary.href}>{primary.label}</Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/#komunitas">Lihat komunitas</Link>
      </Button>
    </div>
  );
}
