"use client";
// Masuk — the OS "sign-in" app. Reuses the convex-auth slice's <AuthCard>
// (Google-only per PRD R1 / DECISIONS #15) + useAuthActions for the real
// OAuth flow — no bespoke auth here. Renders inside an appshell window, so it
// reads auth state client-side via useConvexAuth (root layout mounts Convex).
// Already signed in → a calm confirmation with a jump into Beranda.
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { openWindow, type AppProps } from "@/features/appshell";
import { AuthCard } from "@/features/convex-auth";

const VALUE_PROP =
  "Satu klik dengan akun Google — tanpa password baru, tanpa biaya.";

export default function MasukApp(_props: AppProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-6 p-6 text-center sm:p-8">
      {isLoading ? (
        <div className="h-64 w-full animate-pulse rounded-2xl bg-muted/50" />
      ) : isAuthenticated ? (
        <>
          <header className="space-y-2">
            <span className="eyebrow">Sudah masuk</span>
            <h1 className="font-serif text-3xl sm:text-4xl">
              Kamu sudah <em className="italic text-primary">masuk</em>.
            </h1>
            <p className="text-pretty text-muted-foreground">
              Progres belajarmu tersimpan otomatis. Lanjut dari mana kamu
              berhenti kemarin.
            </p>
          </header>
          <button
            type="button"
            onClick={() => openWindow("beranda", "Beranda")}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Buka Beranda
          </button>
        </>
      ) : (
        <>
          <header className="space-y-2">
            <span className="eyebrow">Masuk · Gratis selamanya</span>
            <h1 className="font-serif text-3xl sm:text-4xl">
              Belajar pakai AI,{" "}
              <em className="italic text-primary">bareng-bareng.</em>
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
            onGoogle={async () => {
              try {
                await signIn("google", { redirectTo: window.location.pathname });
                return { ok: true };
              } catch {
                return { ok: false, error: "Gagal menghubungi Google. Coba lagi." };
              }
            }}
          />
        </>
      )}
    </div>
  );
}
