import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// TODO(rr): assignment #5 — replace the placeholder cards with a "use cache" +
// fetchQuery read of active tenants via the @/features/tenants barrel once
// assignment #1 passes review. Static skeleton keeps launch surface compiling.
export default function HomePage() {
  return (
    <>
      <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Belajar pakai AI, bareng-bareng, gratis.
        </h1>
        <p className="max-w-xl text-lg text-muted-foreground">
          Kelas praktis pengaplikasian AI untuk sehari-hari, kerja, dan usaha —
          berbahasa Indonesia, dipandu komunitas, tanpa biaya.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/login">Mulai belajar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/#komunitas">Lihat komunitas</Link>
          </Button>
        </div>
      </section>

      <section id="komunitas" className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="mb-8 text-center text-2xl font-semibold">Komunitas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Belajar AI bareng Rahman</CardTitle>
              <CardDescription>
                Komunitas pertama — kelas dasar pengaplikasian AI untuk semua orang.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Segera dibuka. Login untuk bergabung begitu kelas pertama tayang.
            </CardContent>
          </Card>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Komunitasmu?</CardTitle>
              <CardDescription>
                Pengajar sukarelawan bisa membuka komunitas sendiri di sini — fitur
                pengajuan menyusul setelah rilis pertama.
              </CardDescription>
            </CardHeader>
          </Card>
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-muted-foreground">Track lain menyusul</CardTitle>
              <CardDescription>
                AI untuk kerja, konten & UMKM — kurikulum ditambah bertahap.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      <section id="tentang" className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2 className="mb-4 text-2xl font-semibold">Kenapa platform ini ada</h2>
        <p className="text-muted-foreground">
          Materi AI kebanyakan berbahasa Inggris, tersebar, dan terlalu teknis.
          Di sini kamu belajar <em>pengaplikasiannya</em> langsung — video singkat,
          materi tertulis, progress tercatat, dan diskusi di Discord. Untuk materi
          fundamental yang proper, tiap lesson menautkan sumber belajarnya.
        </p>
      </section>
    </>
  );
}
