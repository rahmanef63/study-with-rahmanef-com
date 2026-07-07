import type { Metadata } from "next";
import { ProfileSettingsView } from "@/features/profiles";
import { ThemePresetSwitcher } from "@/features/theme-presets";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// G3 (UI-UX-PRD §3): mount the orphan ProfileSettingsView. Account surface —
// marketing chrome + user menu are enough; server authz guards the mutations.
// W1: settings is now a hub — Profil + Tampilan (theme mode/preset) tabs.
export const metadata: Metadata = { title: "Pengaturan profil" };

export default function ProfilSettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-12 sm:py-16">
      <header className="mb-6">
        <span className="eyebrow">Akun</span>
        <h1 className="mt-2 text-2xl sm:text-3xl">Pengaturan</h1>
      </header>
      <Tabs defaultValue="profil" className="gap-6">
        <TabsList>
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="tampilan">Tampilan</TabsTrigger>
        </TabsList>
        <TabsContent value="profil">
          <ProfileSettingsView />
        </TabsContent>
        <TabsContent value="tampilan">
          <section className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-sm font-medium text-foreground">Tema</h2>
              <p className="text-sm text-muted-foreground">
                Pilih mode terang/gelap dan warna tema.
              </p>
            </div>
            <ThemePresetSwitcher />
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
