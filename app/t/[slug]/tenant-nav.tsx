"use client";

// Tenant shell nav (UI-UX-PRD §4 shell): active-state tabs, community
// identity, contextual Kelola/Pengaturan for instructor+/owner, and the
// signed-in user menu (G2). Mobile: tabs scroll horizontally.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Logo, LogoMark } from "@/components/brand/logo";
import { cn } from "@/lib/utils";
import { useCurrentProfile } from "@/features/profiles";
import { ThemePresetSwitcher } from "@/features/theme-presets";
import { useMyMembership, useTenantBySlug } from "@/features/tenants";
import { UserMenu } from "@/components/user-menu";

type Tab = { label: string; href: string; match: (p: string) => boolean };

export function TenantNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const tenant = useTenantBySlug(slug);
  const { membership } = useMyMembership(tenant?._id);
  const { isAuthenticated } = useCurrentProfile();

  const base = `/t/${slug}`;
  const role = membership?.role;
  const canManage = role === "instructor" || role === "owner";

  const tabs: Tab[] = [
    { label: "Kelas", href: base, match: (p) => p === base || p.startsWith(`${base}/kelas`) },
    { label: "Resources", href: `${base}/resources`, match: (p) => p.startsWith(`${base}/resources`) },
    { label: "Usulan", href: `${base}/usulan`, match: (p) => p.startsWith(`${base}/usulan`) },
    { label: "Pengumuman", href: `${base}/pengumuman`, match: (p) => p.startsWith(`${base}/pengumuman`) },
    ...(canManage
      ? [{ label: "Kelola", href: `${base}/kelola/kelas`, match: (p: string) => p.startsWith(`${base}/kelola/kelas`) }]
      : []),
    ...(role === "owner"
      ? [{ label: "Pengaturan", href: `${base}/kelola/komunitas`, match: (p: string) => p.startsWith(`${base}/kelola/komunitas`) }]
      : []),
  ];

  return (
    <header className="flex items-center gap-2 border-b bg-background px-4 py-2 sm:gap-3 sm:px-6">
      <Link
        href="/"
        aria-label="belajar-with-rahmanef.com — beranda"
        className="flex min-h-11 shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogoMark className="size-6 text-primary sm:hidden" />
        <Logo className="hidden sm:inline-flex" />
      </Link>
      {tenant?.name ? (
        <span className="hidden max-w-[12rem] shrink-0 truncate text-sm text-muted-foreground lg:inline">
          <span aria-hidden className="mr-1 text-border">/</span>
          {tenant.name}
        </span>
      ) : null}
      <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto text-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.match(pathname) ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 shrink-0 items-center rounded-md px-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
              tab.match(pathname)
                ? "bg-accent font-medium text-accent-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <ThemePresetSwitcher size="mobile" />
      {isAuthenticated ? (
        <UserMenu />
      ) : (
        <Button asChild variant="outline" className="min-h-11 shrink-0">
          <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`}>Masuk</Link>
        </Button>
      )}
    </header>
  );
}
