"use client";

// First-login onboarding nudge (UI-UX-PRD §5.1): a slim, dismissible welcome
// that points new users to the next steps. Client-only, persisted dismissal.
import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useCurrentProfile } from "@/features/profiles";

const DISMISS_KEY = "onboarding-dismissed";

export function OnboardingNudge() {
  const { isAuthenticated, isLoading, profile } = useCurrentProfile();
  // Default hidden so it never flashes for users who already dismissed it.
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (isLoading || !isAuthenticated || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="border-b bg-primary/5">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm sm:gap-4 sm:px-6 sm:py-2.5">
        <p className="min-w-0 flex-1">
          <span className="font-medium">
            Selamat datang{profile?.displayName ? `, ${profile.displayName}` : ""}!
          </span>{" "}
          <span className="text-muted-foreground">
            Lengkapi{" "}
            <Link
              href="/pengaturan/profil"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              profil
            </Link>
            ,{" "}
            <Link
              href="/#komunitas"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              gabung komunitas
            </Link>
            , lalu mulai lesson pertamamu.
          </span>
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup"
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:size-8"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
