import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ProfileSettingsView } from "@/features/profiles";
import { PengaturanAkun } from "../../_components/pengaturan-akun";

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
    // No <main> and no gutter: app/(akun)/layout.tsx owns both. The reading
    // width and the @container stay here — ProfileSettingsView still sizes
    // itself with container queries (a leftover of the windowed shell), and
    // they have to resolve against the 672px form, not against the 1024px cap
    // <main> carries for /k's grids.
    <div className="@container mx-auto w-full max-w-2xl space-y-10">
      <header className="space-y-2">
        <span className="eyebrow">Akun</span>
        <h1 className="font-display text-lg @sm:text-xl">Pengaturan</h1>
      </header>

      {/* The blurb is SERVER copy above a client card that resolves ~400ms
          later, so it has to be true in both outcomes. It used to read "Kamu
          masuk sebagai berikut" — asserted to a signed-out visitor, on top of a
          card that then said "Belum masuk". */}
      <Section title="Sesi masuk" blurb="Akun yang sedang dipakai di perangkat ini.">
        <PengaturanAkun />
      </Section>

      <Section
        title="Profil"
        blurb="Nama tampilan, username, dan bio yang dilihat anggota lain."
      >
        {/* Owns its own signed-out card (a real /masuk link), so no gate here. */}
        <ProfileSettingsView />
      </Section>
    </div>
  );
}
