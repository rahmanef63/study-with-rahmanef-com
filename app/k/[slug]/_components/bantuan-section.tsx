import Link from "next/link";
import { SectionHeader } from "@/components/mockup-kit";
import { Button } from "@/components/ui/button";

// The retired /docs app, absorbed into Tentang. It was never tenant data — a
// static Bahasa-Indonesia primer on how the product works — so it stays static
// and prerenders with the page. next.config.mjs redirects /docs here.
function Bagian({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <SectionHeader as="h3" title={title} />
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export function BantuanSection() {
  return (
    <section id="bantuan" className="scroll-mt-24 space-y-6">
      <SectionHeader eyebrow="Bantuan" title="Cara pakai platform ini." />

      <Bagian title="Apa itu platform ini?">
        <p>
          Ruang belajar dan komunitas untuk mempraktikkan AI, dalam Bahasa Indonesia — gratis dan
          terbuka. Fokusnya penerapan sehari-hari, bukan teori atau coding: kelas disusun sebagai
          modul dan lesson yang bisa kamu ikuti sesuai kecepatanmu sendiri.
        </p>
      </Bagian>

      <Bagian title="Cara mulai">
        <ol className="ml-4 list-decimal space-y-1.5">
          <li>Masuk dengan akun Google.</li>
          <li>Gabung komunitas ini lewat tombol di atas.</li>
          <li>Buka sebuah kelas, tonton lesson-nya, dan baca materinya.</li>
          <li>Tandai lesson selesai untuk melacak progresmu.</li>
          <li>Kerjakan kuis di akhir modul untuk menguji pemahaman.</li>
        </ol>
      </Bagian>

      <Bagian title="Istilah">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>
            <b className="text-foreground">Komunitas</b> — ruang belajar dengan tema tertentu.
          </li>
          <li>
            <b className="text-foreground">Kelas</b> — kumpulan modul dan lesson di dalam sebuah
            komunitas.
          </li>
          <li>
            <b className="text-foreground">Sumber belajar</b> — tautan kurasi (alat, kursus,
            artikel) yang dibagikan anggota.
          </li>
          <li>
            <b className="text-foreground">Usulan</b> — ide topik atau kelas yang bisa kamu ajukan
            dan vote.
          </li>
        </ul>
      </Bagian>

      <Bagian title="Yang bisa kamu lakukan">
        <ul className="ml-4 list-disc space-y-1.5">
          <li>Melacak progres per lesson sampai kelas selesai.</li>
          <li>Berdiskusi di tiap lesson.</li>
          <li>Membagikan sumber belajar dan mengusulkan topik berikutnya.</li>
          <li>Membaca pengumuman dari pengelola komunitas.</li>
        </ul>
      </Bagian>

      <Bagian title="Ada yang baru?">
        <p>Semua pembaruan platform dicatat di Changelog.</p>
        <Button variant="outline" size="sm" asChild className="min-h-9">
          <Link href="/changelog">Buka Changelog</Link>
        </Button>
      </Bagian>
    </section>
  );
}
