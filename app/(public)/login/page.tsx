"use client";

import { Check } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { AuthCard } from "@/features/convex-auth";

// Google-only per PRD R1 / DECISIONS #15. Labels localized (AGENTS.md §7).
const VALUE_PROPS = [
  "Kelas praktis pengaplikasian AI — berbahasa Indonesia.",
  "Belajar per lesson, progres tersimpan otomatis.",
  "Gratis dan terbuka, dipandu komunitas.",
];

// Only same-origin absolute paths are safe redirect targets. Reject protocol-
// relative ("//evil.com") and anything not starting with a single "/".
function safeReturnTo(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function LoginPage() {
  const { signIn } = useAuthActions();

  return (
    <div className="mx-auto grid min-h-[70dvh] max-w-5xl items-center gap-8 px-6 py-10 md:grid-cols-2 md:gap-10 md:py-16">
      <section className="flex flex-col gap-4 md:gap-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Belajar pakai AI, bareng-bareng.
        </h1>
        <ul className="flex flex-col gap-3">
          {VALUE_PROPS.map((v) => (
            <li key={v} className="flex items-start gap-3 text-muted-foreground">
              <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <span>{v}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mx-auto w-full max-w-md">
        <AuthCard
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
              const dest = safeReturnTo(
                new URLSearchParams(window.location.search).get("returnTo")
              );
              const sep = dest.includes("?") ? "&" : "?";
              await signIn("google", { redirectTo: `${dest}${sep}login=1` });
              return { ok: true };
            } catch {
              return { ok: false, error: "Gagal menghubungi Google. Coba lagi." };
            }
          }}
        />
      </div>
    </div>
  );
}
