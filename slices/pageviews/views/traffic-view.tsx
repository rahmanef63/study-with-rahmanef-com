"use client";
// pageviews slice — connected Traffic dashboard (platform-admin). The consumer
// mounts this ONLY for admins (app/admin/traffic gates on useMyPlatformAdmin);
// the server summary query re-checks requirePlatformAdmin, so this stays safe
// even if mounted ungated (it would just throw for the error boundary). Two
// windows (7d/30d) off one query; charts are the slice's pure CSS primitives.
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { HBarList } from "../components/h-bar-list";
import { MiniBars } from "../components/mini-bars";
import { StatTile } from "../components/stat-tile";
import { useTrafficSummary } from "../hooks/use-traffic-summary";

const WEEK = 7 * 24 * 60 * 60 * 1000;
const MONTH = 30 * 24 * 60 * 60 * 1000;
const fmt = (n: number) => n.toLocaleString("id-ID");

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
      {children}
    </section>
  );
}

export type TrafficViewProps = { className?: string };

export function TrafficView({ className }: TrafficViewProps) {
  const d7 = useTrafficSummary(WEEK);
  const d30 = useTrafficSummary(MONTH);

  if (d7 === undefined || d30 === undefined) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      <header className="space-y-1 border-b pb-5">
        <span className="eyebrow">Analitik</span>
        <h2 className="mt-1 text-2xl sm:text-3xl">Traffic pengunjung</h2>
        <p className="mt-2 max-w-xl text-pretty text-sm text-muted-foreground">
          Beacon mandiri tanpa cookie — kunjungan halaman, sumber rujukan, dan lokasi
          (negara/kota via geoip). Tanpa cookie, tanpa menyimpan IP.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="kunjungan · 7 hari" value={fmt(d7.total)} />
        <StatTile label="pengunjung unik · 7 hari" value={fmt(d7.uniqueSessions)} />
        <StatTile label="kunjungan · 30 hari" value={fmt(d30.total)} />
        <StatTile label="negara teratas" value={d30.topCountries[0]?.key ?? "—"} />
      </div>

      <Panel title="Volume · 30 hari" sub={`${fmt(d30.total)} kunjungan`}>
        {d30.perDay.length ? (
          <MiniBars values={d30.perDay.map((p) => p.count)} labels={d30.perDay.map((p) => p.day)} />
        ) : (
          <p className="text-sm text-muted-foreground">Belum ada data.</p>
        )}
      </Panel>

      {d7.topPaths.length > 0 ? (
        <Panel title="Halaman teratas · 7 hari">
          <HBarList items={d7.topPaths.map((p) => ({ label: p.key, value: p.count }))} unit="×" />
        </Panel>
      ) : null}
      {d7.topReferrers.length > 0 ? (
        <Panel title="Sumber rujukan teratas · 7 hari">
          <HBarList items={d7.topReferrers.map((p) => ({ label: p.key, value: p.count }))} />
        </Panel>
      ) : null}
      {d30.topCountries.length > 0 ? (
        <Panel title="Negara teratas · 30 hari">
          <HBarList items={d30.topCountries.map((p) => ({ label: p.key, value: p.count }))} />
        </Panel>
      ) : null}
      {d30.topCities.length > 0 ? (
        <Panel title="Kota teratas · 30 hari">
          <HBarList items={d30.topCities.map((p) => ({ label: p.key, value: p.count }))} />
        </Panel>
      ) : null}

      {d7.capped || d30.capped ? (
        <p className="text-xs text-muted-foreground">
          ⚠ Batas {fmt(10000)} baris tercapai — angka bisa under-count. Tambah agregasi harian
          kalau trafik tumbuh.
        </p>
      ) : null}
    </div>
  );
}
