"use client";
import { PlatformTrafficView } from "@/features/analytics";
export default function AdminVisitorsPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">Pengunjung</h1><p className="mt-2 text-sm text-muted-foreground">Kunjungan halaman publik, sumber trafik, dan campaign. Sesi tidak sama dengan orang.</p></header><PlatformTrafficView enabled /></section>;
}
