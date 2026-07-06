import { TenantNav } from "./tenant-nav";

// Minimal workspace shell (drift log 2026-07-06: rr dashboard-shell deferred).
// One outer chrome, full-bleed h-dvh per rr UI rules — no marketing chrome here.
// Nav + user menu live in the client TenantNav (active state, role-gated tabs).
export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="flex h-dvh flex-col">
      <TenantNav slug={slug} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
