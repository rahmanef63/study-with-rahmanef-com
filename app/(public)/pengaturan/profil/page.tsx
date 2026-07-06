import type { Metadata } from "next";
import { ProfileSettingsView } from "@/features/profiles";

// G3 (UI-UX-PRD §3): mount the orphan ProfileSettingsView. Account surface —
// marketing chrome + user menu are enough; server authz guards the mutations.
export const metadata: Metadata = { title: "Pengaturan profil" };

export default function ProfilSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <ProfileSettingsView />
    </div>
  );
}
