import Link from "next/link";
import { communityHref } from "@/lib/community";
const destinations = [
  [communityHref.adminAnalytics(), "Statistik belajar", "Anggota aktif, perkembangan kelas, materi, kuis, dan aktivitas komunitas."],
  [communityHref.adminTraffic(), "Pengunjung", "Kunjungan, sumber trafik, campaign, perangkat, dan negara pada halaman publik."],
  [communityHref.adminCommunities(), "Komunitas", "Tinjau permintaan pembukaan komunitas dan kelola persetujuannya."],
  [communityHref.adminMcp(), "MCP admin", "Hubungkan asisten dengan pengelolaan dan analitik sesuai izin admin."],
] as const;
export default function AdminIndexPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">Admin platform</h1><p className="mt-2 text-sm text-muted-foreground">Pantau Study dan kelola komunitas dari satu tempat.</p></header><div className="divide-y border-y">{destinations.map(([href, label, description]) => <Link key={href} href={href} className="block min-h-11 space-y-1 py-4 hover:bg-muted/30"><h2 className="font-semibold text-primary">{label} →</h2><p className="text-sm text-muted-foreground">{description}</p></Link>)}</div></section>;
}
