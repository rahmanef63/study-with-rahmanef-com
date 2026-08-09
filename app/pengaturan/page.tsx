import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProfileSettingsView } from "@/features/profiles";
import { PengaturanAkun } from "../_components/pengaturan-akun";

// Account settings. The OS version was a three-pane master/detail whose nav
// chrome differed per emulated OS; on a real route it collapses to one column
// of sections. Gone: the per-OS "Shell" picker, the 37-preset colour gallery,
// the light/dark toggle, and "Tentang" (mostly shell diagnostics). The app has
// exactly one theme — the arcade cabinet — so there is nothing left to pick.
export const metadata: Metadata = {
  title: "Pengaturan",
  description: "Atur akun dan profil publikmu di belajar-with-rahmanef.com.",
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
        <h2 className="font-display text-sm">{title}</h2>
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
        <h1 className="font-display text-lg @sm:text-xl">Pengaturan</h1>
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
    </main>
  );
}
