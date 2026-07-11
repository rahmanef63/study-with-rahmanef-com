import Link from "next/link";

// Thin admin shell — a tab bar over the platform-admin pages so /admin/traffic
// is discoverable next to /admin/komunitas. Server component (no active-state
// hook): links use next/link per the "next/link only" rule; the pages under it
// self-gate on requirePlatformAdmin (route guards = UX).
const TABS = [
  { href: "/admin/komunitas", label: "Komunitas" },
  { href: "/admin/traffic", label: "Traffic" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b">
        <nav className="mx-auto flex max-w-5xl items-center gap-1 px-6 py-3 text-sm">
          <span className="mr-3 font-semibold text-foreground">Admin</span>
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
