"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { MarketingHeader } from "@/features/marketing-chrome";
import { useCurrentProfile } from "@/features/profiles";
import { UserMenu } from "@/components/user-menu";

const BRAND = { name: "belajar-with-rahmanef.com", href: "/" };
const NAV = [
  { label: "Beranda", href: "/" },
  { label: "Komunitas", href: "/#komunitas" },
  { label: "Tentang", href: "/#tentang" },
];

export function PublicHeader() {
  // Profile bootstrap lives at root (components/profile-bootstrap.tsx) now (G1).
  const { isLoading, isAuthenticated } = useCurrentProfile();
  const handled = useRef(false);

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
      cta={isAuthenticated ? undefined : { label: "Masuk", href: "/login" }}
      actions={isAuthenticated ? <UserMenu /> : undefined}
      sticky
    />
  );
}
