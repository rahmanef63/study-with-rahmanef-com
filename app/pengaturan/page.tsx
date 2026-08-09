import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProfileSettingsView } from "@/features/profiles";
import { PengaturanAkun } from "../_components/pengaturan-akun";
import { PengaturanTampilan } from "../_components/pengaturan-tampilan";

// Account settings. The OS version was a three-pane master/detail whose nav
// chrome differed per emulated OS; on a real route it collapses to one column
// of sections. Gone with the shell they configured: the per-OS "Shell" picker,
// the 37-preset colour gallery (light/dark is the whole choice now), and
// "Tentang", which was mostly shell diagnostics.
export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Atur akun, profil publik, dan tampilan belajar-with-rahmanef.com.",
  robots: { index: false },
};

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-0.5 border-b pb-3">
        <h2 className="font-serif text-xl">{title}</h2>
        <p className="text-sm text-muted-foreground">{blurb}</p>
      </header>
      {children}
    </section>
  );
}

export default function PengaturanPage() {
  return (
    // @container: ProfileSettingsView still sizes with container queries (a
    // leftover of the windowed shell), so a real route has to declare the
    // container they resolve against.
    <main className="@container mx-auto w-full max-w-2xl space-y-10 px-6 py-12">
      <header className="space-y-2">
        <span className="eyebrow">Akun</span>
        <h1 className="font-serif text-3xl @sm:text-4xl">Pengaturan</h1>
      </header>

      <Section title="Sesi masuk" blurb="Kamu masuk sebagai berikut. Bisa keluar kapan saja.">
        <PengaturanAkun />
      </Section>

      <Section
        title="Profil"
        blurb="Nama tampilan, username, dan bio yang dilihat anggota lain."
      >
        {/* Owns its own signed-out card (a real /masuk link), so no gate here. */}
        <ProfileSettingsView />
      </Section>

      <Section title="Tampilan" blurb="Terang, gelap, atau ikut pengaturan perangkatmu.">
        <PengaturanTampilan />
      </Section>
    </main>
  );
}
