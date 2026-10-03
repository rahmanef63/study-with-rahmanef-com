import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";
import { Button } from "../../components/ui/button";
import { AppShell } from "../../components/shell/app-shell";
import { SidebarUser } from "../../components/shell/sidebar-user";
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
  const days = (params.get("days") === "7" ? 7 : params.get("days") === "90" && view === "learning" ? 90 : 30) as PlatformAnalyticsDays;
  const set = (key: string, value: string | number) => { const next = new URLSearchParams(params); next.set(key, String(value)); navigate(`?${next}`); };
  const navigation = <nav aria-label="Tampilan fixture" className="flex flex-wrap gap-1">{Object.entries(views).map(([key, label]) => <Button key={key} variant={view === key ? "default" : "outline"} className="min-h-11" aria-current={view === key ? "page" : undefined} onClick={() => set("view", key)}>{label}</Button>)}</nav>;
  const selectors = <div className="space-y-3 text-sm"><label className="block space-y-1"><span>Peran fixture</span><select aria-label="Peran fixture" value={role} onChange={event => set("role", event.target.value)} className="min-h-11 w-full min-w-0 rounded border border-input bg-background px-2"><option value="admin">Admin platform</option><option value="member">Anggota</option><option value="anonymous">Belum login</option><option value="loading">Auth loading</option></select></label><label className="block space-y-1"><span>Kelengkapan fixture</span><select aria-label="Kelengkapan fixture" value={state} onChange={event => set("state", event.target.value)} className="min-h-11 w-full min-w-0 rounded border border-input bg-background px-2"><option value="complete">Lengkap</option><option value="partial">Sebagian</option><option value="empty">Kosong</option></select></label></div>;
  const rail = <div className="flex h-full min-h-0 flex-col"><div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4"><p className="font-semibold">Fixture admin lokal</p><p className="text-xs text-muted-foreground">Bukan sesi produksi. Semua identitas dan angka adalah data uji.</p>{selectors}{navigation}</div><div className="border-t border-border py-2"><SidebarUser /></div></div>;
  const topBar = <div className="space-y-3 border-b border-border bg-sidebar p-4 md:hidden"><p className="text-xs text-muted-foreground">Fixture lokal · bukan sesi produksi</p>{navigation}{selectors}<SidebarUser /></div>;
  return <AppShell rail={rail} topBar={topBar}>
    <header className="mb-7"><p className="mb-2 text-xs text-muted-foreground">Fixture lokal · bukan sesi produksi</p><h1 className="text-2xl font-semibold">{views[view]}</h1></header>
    {view === "learning" ? <PlatformAnalyticsDashboard key={`${state}:${days}`} data={learningData(days, state)} days={days} onDaysChange={value => set("days", value)} /> : view === "traffic" ? <PlatformTrafficDashboard key={`${state}:${days}`} data={trafficData(days as PlatformTrafficDays, state)} days={days as PlatformTrafficDays} onDaysChange={value => set("days", value)} /> : view === "users" || view === "user-detail" ? <FixtureUsers key={`${view}:${state}:${role}`} state={state} detail={view === "user-detail"} role={role} /> : view === "richtext" ? <FixtureRichtext /> : view === "mcp" ? <FixtureMcp /> : <div className="space-y-5"><p className="text-sm text-muted-foreground">Buka menu akun pada sidebar atau header mobile untuk memeriksa menu Admin platform dan Statistik &amp; analitik. Peran fixture hanya memengaruhi presentasi; ini bukan pengujian otorisasi produksi.</p><nav aria-label="Tautan akun hasil kontrak" className="space-y-2">{accountLinks("fixture-admin", role === "admin").map(link => <div key={link.key} className="border-b border-border py-2 text-sm"><span>{link.label}</span><span className="ml-3 break-all font-mono text-xs text-muted-foreground">{link.href}</span></div>)}</nav></div>}
    <Toaster />
  </AppShell>;
}
createRoot(document.getElementById("root")!).render(<AdminFixture />);
