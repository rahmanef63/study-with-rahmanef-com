// pageviews slice — client projection of the summary query result (mirrors the
// convex return shape; kept local so the slice stays portable and doesn't deep-
// import a convex module path).
export type TrafficBucket = { key: string; count: number };

export type TrafficSummary = {
  total: number;
  capped: boolean;
  uniqueSessions: number;
  topPaths: TrafficBucket[];
  topReferrers: TrafficBucket[];
  topCountries: TrafficBucket[];
  topCities: TrafficBucket[];
  perDay: { day: string; count: number }[];
};
