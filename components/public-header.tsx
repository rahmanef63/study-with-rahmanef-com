"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/features/marketing-chrome";
import { useCurrentProfile, useEnsureProfileOnFirstLogin } from "@/features/profiles";

const BRAND = { name: "belajar-with-rahmanef.com", href: "/" };
const NAV = [
  { label: "Beranda", href: "/" },
  { label: "Komunitas", href: "/#komunitas" },
  { label: "Tentang", href: "/#tentang" },
];

export function PublicHeader() {
  const { profile, isLoading, isAuthenticated } = useCurrentProfile();
  const handled = useRef(false);
  useEnsureProfileOnFirstLogin(isAuthenticated && !isLoading && profile === null);

  useEffect(() => {
    if (isLoading || handled.current) return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("login")) return;
    if (url.searchParams.has("code")) return;
    handled.current = true;
    if (isAuthenticated && url.searchParams.get("login") !== "failed") {
      toast.success("Berhasil masuk");
    } else {
      toast.error("Login belum berhasil. Silakan coba lagi.");
    }
    url.searchParams.delete("login");
    window.history.replaceState({}, "", url);
  }, [isAuthenticated, isLoading]);

  return (
    <MarketingHeader
      brand={BRAND}
      nav={NAV}
      cta={
        isAuthenticated
          ? { label: profile?.displayName ?? "Sudah masuk", href: "/#komunitas" }
          : { label: "Masuk", href: "/login" }
      }
      sticky
    />
  );
}
