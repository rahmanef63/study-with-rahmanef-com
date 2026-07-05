import Link from "next/link";

// Minimal workspace shell (drift log 2026-07-06: rr dashboard-shell deferred).
// One outer chrome, full-bleed h-dvh per rr UI rules — no marketing chrome here.
// TODO(rr): assignment #5 — tenant name + nav (Kelas / Resources / Pengumuman)
// wired via the @/features/tenants barrel after assignment #1 passes review.
export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center gap-4 border-b px-4 py-2">
        <Link href="/" className="text-sm font-semibold">
          belajar-with-rahmanef.com
        </Link>
        <span className="text-sm text-muted-foreground">/ komunitas</span>
      </header>
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
