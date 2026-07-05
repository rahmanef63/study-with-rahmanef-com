"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { AuthCard } from "@/features/convex-auth";

// Google-only per PRD R1 / DECISIONS #15. Labels localized (AGENTS.md §7).
export default function LoginPage() {
  const { signIn } = useAuthActions();

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24">
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
            await signIn("google", { redirectTo: "/" });
            return { ok: true };
          } catch {
            return { ok: false, error: "Gagal menghubungi Google. Coba lagi." };
          }
        }}
      />
    </div>
  );
}
