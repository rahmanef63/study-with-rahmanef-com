// comments slice — relative timestamp in Bahasa Indonesia. Pure (injectable
// `now` for tests); falls back to an absolute id-ID date beyond a week so old
// threads stay scannable.
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const delta = Math.max(0, now - timestamp);
  if (delta < MINUTE) return "baru saja";
  if (delta < HOUR) return `${Math.floor(delta / MINUTE)} menit lalu`;
  if (delta < DAY) return `${Math.floor(delta / HOUR)} jam lalu`;
  if (delta < WEEK) return `${Math.floor(delta / DAY)} hari lalu`;
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
