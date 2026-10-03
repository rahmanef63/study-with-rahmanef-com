import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { Button } from "../../components/ui/button";
import { AppShell } from "../../components/shell/app-shell";
import { SidebarUser } from "../../components/shell/sidebar-user";
import { AdminPageHeader } from "../../components/admin/admin-page-header";
import { AdminSidebar } from "../../components/admin/admin-sidebar";
import { accountLinks } from "../../components/shell/nav-model";
import { PlatformAnalyticsDashboard } from "../../slices/analytics/components/platform-analytics-dashboard";
import { PlatformTrafficDashboard } from "../../slices/analytics/components/platform-traffic-dashboard";
import type { PlatformAnalyticsDays, PlatformTrafficDays } from "../../slices/analytics/types";
import { learningData, type FixtureState } from "./learning-data";
import { trafficData } from "./traffic-data";
import { FixtureRichtext } from "./richtext-view";
import { FixtureMcp } from "./mcp-view";
import { FixtureUsers } from "./users-view";
import { navigate, useFixtureParams } from "./next-adapter";
import "../../app/globals.css";
const views = { menu: "Menu akun admin", learning: "Statistik belajar platform", traffic: "Statistik pengunjung", users: "Pengguna", "user-detail": "Aktivitas pengguna", richtext: "Richtext dan media", mcp: "MCP admin" };
function AdminFixture() {
  const params = useFixtureParams();
  const requested = params.get("view") ?? "menu";
  const view = requested in views ? requested as keyof typeof views : "menu";
  const role = params.get("role") ?? "admin";
  const state = (["complete", "partial", "empty"].includes(params.get("state") ?? "") ? params.get("state") : "complete") as FixtureState;
  const requestedDays = params.get("days");
  const learningDays = (requestedDays === "7" || requestedDays === "90" || requestedDays === "180" || requestedDays === "365" ? Number(requestedDays) : 30) as PlatformAnalyticsDays;
  const trafficDays = (requestedDays === "7" ? 7 : 30) as PlatformTrafficDays;
  const set = (key: string, value: string | number) => { const next = new URLSearchParams(params); next.set(key, String(value)); navigate(`?${next}`); };
  const navigation = <nav aria-label="Tampilan fixture" className="flex flex-wrap gap-1">{Object.entries(views).map(([key, label]) => <Button key={key} variant={view === key ? "default" : "outline"} className="min-h-11" aria-current={view === key ? "page" : undefined} onClick={() => set("view", key)}>{label}</Button>)}</nav>;
  const selectors = <div className="space-y-3 text-sm"><label className="block space-y-1"><span>Peran fixture</span><select aria-label="Peran fixture" value={role} onChange={event => set("role", event.target.value)} className="min-h-11 w-full min-w-0 rounded border border-input bg-background px-2"><option value="admin">Admin platform</option><option value="member">Anggota</option><option value="anonymous">Belum login</option><option value="loading">Auth loading</option></select></label><label className="block space-y-1"><span>Kelengkapan fixture</span><select aria-label="Kelengkapan fixture" value={state} onChange={event => set("state", event.target.value)} className="min-h-11 w-full min-w-0 rounded border border-input bg-background px-2"><option value="complete">Lengkap</option><option value="partial">Sebagian</option><option value="empty">Kosong</option></select></label></div>;
  const pageCopy: Record<string, [string, string | undefined]> = {
    menu: ["Admin platform", "Pantau Study dan kelola komunitas. Pilih satu kelompok; angka lengkap ada di halaman masing-masing."],
    learning: ["Statistik belajar", "Aktivitas anggota dan perkembangan seluruh komunitas di Study."],
    traffic: ["Pengunjung", "Kunjungan halaman publik, sumber trafik, dan campaign. Sesi tidak sama dengan orang."],
    users: ["Pengguna", "Akun terdaftar, aktivitas terakhir, dan status belajar. Buka akun untuk melihat progres serta sumber kunjungannya."],
    "user-detail": ["Aktivitas pengguna", undefined],
    mcp: ["MCP admin", "Akses analitik dan pengelolaan platform dari asisten melalui token admin milik Anda."],
    richtext: ["Richtext dan media", undefined],
  };
  const [pageTitle, pageDescription] = pageCopy[view] ?? ["Admin platform", undefined];
  const rail = <div className="flex h-full min-h-0 flex-col"><div className="min-h-0 flex-1 overflow-y-auto"><AdminSidebar /><div className="space-y-5 p-4"><p className="text-xs text-muted-foreground">Fixture lokal. Angka di bawah adalah data uji, bukan produksi.</p><details><summary className="min-h-11 cursor-pointer text-sm">Kontrol fixture</summary><div className="space-y-4 pt-3">{selectors}{navigation}</div></details></div></div><div className="border-t border-border py-2"><SidebarUser /></div></div>;
  const topBar = <div className="border-b bg-card px-4 py-3 text-sm font-medium md:hidden">Admin platform</div>;
  return <AppShell rail={rail} topBar={topBar}>
    <div className="mb-6"><AdminPageHeader title={pageTitle} description={pageDescription} /></div>
    {view === "learning" ? <PlatformAnalyticsDashboard key={`${state}:${learningDays}`} data={learningData(learningDays, state)} days={learningDays} onDaysChange={value => set("days", value)} /> : view === "traffic" ? <PlatformTrafficDashboard key={`${state}:${trafficDays}`} data={trafficData(trafficDays, state)} days={trafficDays} onDaysChange={value => set("days", value)} /> : view === "users" || view === "user-detail" ? <FixtureUsers key={`${view}:${state}:${role}`} state={state} detail={view === "user-detail"} role={role} /> : view === "richtext" ? <FixtureRichtext /> : view === "mcp" ? <FixtureMcp /> : <div className="space-y-5"><p className="text-sm text-muted-foreground">Buka menu akun pada sidebar atau header mobile untuk memeriksa menu Admin platform dan Statistik &amp; analitik. Peran fixture hanya memengaruhi presentasi; ini bukan pengujian otorisasi produksi.</p><nav aria-label="Tautan akun hasil kontrak" className="space-y-2">{accountLinks("fixture-admin", role === "admin").map(link => <div key={link.key} className="border-b border-border py-2 text-sm"><span>{link.label}</span><span className="ml-3 break-all font-mono text-xs text-muted-foreground">{link.href}</span></div>)}</nav></div>}
    <Toaster />
  </AppShell>;
}
createRoot(document.getElementById("root")!).render(<AdminFixture />);
