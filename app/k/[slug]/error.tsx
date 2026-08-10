"use client";

// Community-scoped error boundary.
//
// Without it, any throw inside /k/<slug>/* escapes to app/error.tsx, which
// REPLACES the whole route — sticky nav bar and bottom tab bar included. On a
// phone that leaves a bare apology with no header, no tabs and no way back into
// the community except the browser's back button. Catching here keeps the
// failure inside CommunityLayout, so the shell survives and the member can tap
// straight into another tab.
import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { communityHref } from "@/lib/community";

export default function CommunityError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const params = useParams<{ slug: string }>();

  useEffect(() => {
    console.error("[k:error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-6 py-16 text-center">
      <h1 className="text-lg font-semibold">Bagian ini gagal dimuat</h1>
      <p className="text-muted-foreground text-sm">
        Sisa komunitas masih jalan — coba muat ulang bagian ini, atau pindah ke tab lain.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button onClick={reset} className="min-h-11 @sm:min-h-9">
          Coba lagi
        </Button>
        {params?.slug && (
          <Button asChild variant="outline" className="min-h-11 @sm:min-h-9">
            <Link href={communityHref.home(params.slug)}>Kembali ke komunitas</Link>
          </Button>
        )}
      </div>
    </div>
  );
}
