// pageviews slice — public barrel (THE contract; barrel-only cross-slice
// imports, rr-conventions P1). Cookieless visitor analytics + platform-admin
// Traffic dashboard.
//
// Convex surface (not re-exported; call via api.features.pageviews.*):
//   mutations.record — PUBLIC beacon ingest (called ONLY by /api/analytics)
//   queries.summary  — platform-admin Traffic dashboard read
//
// Client beacon lives at components/analytics-beacon.tsx (mounted in the root
// layout), not in this slice, because it is app-global chrome not an admin view.

// feature descriptor
export { pageviewsFeature } from "./config";

// connected view (mount inside the /admin/traffic route or an OS admin window)
export { TrafficView, type TrafficViewProps } from "./views/traffic-view";

// presentational components (props-driven, portable)
export { StatTile, type StatTileProps } from "./components/stat-tile";
export { MiniBars, type MiniBarsProps } from "./components/mini-bars";
export { HBarList, type HBarListProps, type HBarItem } from "./components/h-bar-list";

// hooks (reads — the beacon writes, this slice's UI only reads)
export { useTrafficSummary } from "./hooks/use-traffic-summary";

// types
export type { TrafficSummary, TrafficBucket } from "./types";
