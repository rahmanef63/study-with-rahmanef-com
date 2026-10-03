import { useState } from "react";
import { PlatformUsersDashboard } from "../../slices/analytics/components/platform-users-dashboard";
import { PlatformUserDetail } from "../../slices/analytics/components/platform-user-detail";
import { usersData, userDetailData } from "./users-data";
import type { FixtureState } from "./learning-data";

export function FixtureUsers({ state, detail, role }: { state: FixtureState; detail: boolean; role: string }) {
  const [search, setSearch] = useState("");
  const [loaded, setLoaded] = useState(20);
  if (role === "member" || role === "anonymous") return <p role="status" className="py-8">Fixture akses admin diperlukan. Ini bukan bukti otorisasi produksi.</p>;
  if (detail) return <PlatformUserDetail data={userDetailData(state)} geoAttributionHref="https://db-ip.com" />;
  const all = usersData(state);
  const rows = all.slice(0, loaded).filter(row => `${row.displayName} ${row.username ?? ""} ${row.email ?? ""}`.toLocaleLowerCase("id-ID").includes(search.trim().toLocaleLowerCase("id-ID")));
  return <PlatformUsersDashboard rows={rows} status={role === "loading" ? "LoadingFirstPage" : loaded < all.length ? "CanLoadMore" : "Exhausted"} search={search} onSearchChange={setSearch} onLoadMore={() => setLoaded(value => value + 20)} detailHref={id => `?view=user-detail&state=${state}&fixtureId=${id}`} />;
}
