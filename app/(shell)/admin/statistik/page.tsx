"use client";
import { PlatformAnalyticsView } from "@/features/analytics";
export default function AdminStatisticsPage() {
  return <section className="space-y-6"><header><h1 className="text-2xl font-semibold">Statistik belajar</h1><p className="mt-2 text-sm text-muted-foreground">Aktivitas anggota dan perkembangan seluruh komunitas di Study.</p></header><PlatformAnalyticsView enabled /></section>;
}
