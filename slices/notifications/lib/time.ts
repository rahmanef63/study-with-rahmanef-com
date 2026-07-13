// notifications slice — relative timestamp in Bahasa Indonesia. Pure
// (injectable `now` for tests); absolute id-ID date beyond a week.
//
// TODO(rr): waiting on integrator — second occurrence of this util (first:
// slices/comments/lib/time.ts); hoist to shared/time/utils and re-export from
// both barrels (proposal in beta's #21 report). Duplicated here instead of
// importing "@/features/comments" because the vitest config lacks the
// `@/features/*` alias (see slices/comments/__tests__/barrel.test.ts note)
// and a bell/inbox slice must not depend on the comments slice to render.
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
