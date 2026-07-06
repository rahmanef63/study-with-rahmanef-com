import { TenantSettingsView } from "@/features/tenants";

// G4 (UI-UX-PRD §3): mount the orphan TenantSettingsView — owner edits the
// community profile + Discord invite/webhook here. Owner-only Convex authz is
// the real guard; the view renders its own denied state for everyone else.
export default async function KelolaKomunitasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <TenantSettingsView slug={slug} />
    </div>
  );
}
