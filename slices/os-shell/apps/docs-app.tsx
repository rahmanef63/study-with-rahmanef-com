"use client";
// Docs — a short, static platform guide (Bahasa Indonesia). No backend: it's
// help content, not tenant data. Sibling of Changelog in the Platform group.
import { type AppProps } from "@/features/appshell";
import { openApp } from "./_nav";
import { Hero, SectionHeader } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionHeader as="h2" title={title} />
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function DocsApp(_props: AppProps) {
  return (
    <div className="w-full space-y-8 p-6 @md:p-8">
      <Hero
        eyebrow="Platform"
        title="Docs"
        description="Panduan singkat memakai platform belajar ini."
      />

      <div className="mx-auto w-full max-w-3xl space-y-8">
        <Section title="Apa itu platform ini?">
          <p>
            Ruang belajar dan komunitas untuk mempraktikkan AI, dalam Bahasa Indonesia — gratis.
            Belajar lewat kelas berisi video singkat, materi, kuis, dan diskusi bareng anggota lain.
          </p>
        </Section>

        <Section title="Cara mulai">
          <ol className="ml-4 list-decimal space-y-1.5">
            <li>Masuk dengan akun Google.</li>
            <li>Pilih sebuah komunitas dan gabung.</li>
            <li>Buka sebuah kelas, lalu tonton lesson (video YouTube) dan baca materinya.</li>
            <li>Tandai lesson selesai untuk melacak progresmu.</li>
            <li>Kerjakan kuis di akhir modul untuk menguji pemahaman.</li>
          </ol>
        </Section>

        <Section title="Istilah">
          <ul className="ml-4 list-disc space-y-1.5">
            <li><b className="text-foreground">Komunitas</b> — ruang belajar dengan tema tertentu (mis. “Belajar AI”).</li>
            <li><b className="text-foreground">Kelas</b> — kumpulan modul dan lesson di dalam sebuah komunitas.</li>
            <li><b className="text-foreground">Sumber belajar</b> — tautan kurasi (alat, kursus, artikel) yang dibagikan komunitas.</li>
            <li><b className="text-foreground">Usulan</b> — ide topik/kelas yang bisa kamu ajukan dan vote.</li>
          </ul>
        </Section>

        <Section title="Fitur">
          <ul className="ml-4 list-disc space-y-1.5">
            <li>Progres belajar per lesson dan penyelesaian kelas.</li>
            <li>Diskusi pada tiap lesson.</li>
            <li>Papan Sumber belajar dan kotak Usulan (dengan vote).</li>
            <li>Pengumuman dari pengelola komunitas.</li>
          </ul>
        </Section>

        <Section title="Ada yang baru?">
          <p>Lihat daftar pembaruan platform di Changelog.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openApp("changelog", "Changelog")}
          >
            Buka Changelog
          </Button>
        </Section>
      </div>
    </div>
  );
}
