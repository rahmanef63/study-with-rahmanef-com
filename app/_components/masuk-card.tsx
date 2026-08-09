"use client";

// The sign-in panel. Client because auth state only exists in the browser
// (ConvexAuthProvider keeps its tokens in localStorage). Reuses the
// convex-auth slice's <AuthCard> — Google-only per PRD R1 / DECISIONS #15.
import Link from "next/link";
import { useConvexAuth } from "convex/react";
import { AuthCard, useAuthFlow } from "@/features/convex-auth";
import { Skeleton } from "@/components/ui/skeleton";

const VALUE_PROP = "Satu klik dengan akun Google — tanpa password baru, tanpa biaya.";

export function MasukCard({ next }: { next: string }) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signInWithGoogle } = useAuthFlow();

  if (isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (isAuthenticated) {
    return (
      <>
        <header className="space-y-2">
          <span className="eyebrow">Sudah masuk</span>
          <h1 className="font-display text-lg @sm:text-xl">
            Kamu sudah <em className="italic text-primary">masuk</em>.
          </h1>
          <p className="text-pretty text-muted-foreground">
            Progres belajarmu tersimpan otomatis. Lanjut dari mana kamu berhenti kemarin.
          </p>
        </header>
        <Link
          href={next}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Lanjutkan
        </Link>
      </>
    );
  }

  return (
    <>
      <header className="space-y-2">
        <span className="eyebrow">Masuk · Gratis selamanya</span>
        <h1 className="font-display text-lg @sm:text-xl">
          Belajar pakai AI, <em className="italic text-primary">bareng-bareng.</em>
        </h1>
        <p className="text-pretty text-muted-foreground">{VALUE_PROP}</p>
      </header>
      <AuthCard
        className="w-full text-left"
        methods={["google"]}
        title="Masuk"
        description="Pakai akun Google-mu — tanpa password baru."
        labels={{
          googleButton: "Masuk dengan Google",
          googleButtonLoading: "Mengalihkan ke Google…",
          genericError: "Ada kendala saat masuk. Coba lagi ya.",
        }}
        // `next` comes from the server, already open-redirect checked. The OS
        // app passed window.location.pathname here, which is always "/masuk"
        // by the time it runs — every invited user bounced back to the login
        // screen instead of the page they were invited to.
        onGoogle={() => signInWithGoogle(next)}
      />
    </>
  );
}
