import Link from "next/link";

// Minimal workspace shell (drift log 2026-07-06: rr dashboard-shell deferred).
// One outer chrome, full-bleed h-dvh per rr UI rules — no marketing chrome here.
// v1.1: nav tabs for the community surfaces (#7 resources/usulan, #10 pengumuman).
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const base = `/t/${slug}`;
  const tabs = [
    { label: "Kelas", href: base },
    { label: "Resources", href: `${base}/resources` },
    { label: "Usulan", href: `${base}/usulan` },
    { label: "Pengumuman", href: `${base}/pengumuman` },
  ];
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b px-4 py-2">
        <Link href="/" className="text-sm font-semibold">
          belajar-with-rahmanef.com
        </Link>
        <nav className="flex items-center gap-3 text-sm text-muted-foreground">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href} className="hover:text-foreground">
              {tab.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
