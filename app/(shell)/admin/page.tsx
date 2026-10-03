import Link from "next/link";
import { communityHref } from "@/lib/community";

const groups = [
  {
    title: "Pantau",
    description: "Angka yang sudah dihitung platform. Buka halaman untuk melihat rinciannya.",
    items: [
      [communityHref.adminAnalytics(), "Statistik belajar", "Aktivitas anggota, kelas, materi, kuis, dan kelengkapan data."],
      [communityHref.adminTraffic(), "Pengunjung", "Kunjungan halaman publik. Data ini disimpan 30 hari."],
      [communityHref.adminUsers(), "Pengguna", "Akun terdaftar dan ringkasan belajar tiap orang."],
    ],
  },
  {
    title: "Kelola",
    description: "Tindakan admin platform.",
    items: [
      [communityHref.adminCommunities(), "Komunitas", "Permintaan pembukaan komunitas dan persetujuannya."],
      [communityHref.adminMcp(), "MCP admin", "Akses asisten untuk pengelolaan dan analitik sesuai izin admin."],
    ],
  },
] as const;

export default function AdminIndexPage() {
  return (
    <section className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold">Admin platform</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pantau Study dan kelola komunitas. Pilih satu kelompok; angka lengkap ada di halaman masing-masing.
        </p>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} aria-labelledby={`admin-${group.title}`} className="border bg-card">
            <div className="border-b px-4 py-3">
              <h2 id={`admin-${group.title}`} className="text-lg font-semibold">{group.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{group.description}</p>
            </div>
            <ul>
              {group.items.map(([href, label, description]) => (
                <li key={href} className="border-t first:border-t-0">
                  <Link href={href} className="block min-h-11 px-4 py-3 hover:bg-muted/40">
                    <span className="font-semibold text-primary">{label}</span>
                    <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}
