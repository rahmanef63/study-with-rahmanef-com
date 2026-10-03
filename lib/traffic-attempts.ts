// Optional telemetry must not create an unlimited service-authenticated proxy.
// Process-local burst guard supplements the authoritative Convex daily budgets.
let minuteStart = 0;
let minuteCount = 0;
let dayStart = 0;
let dayCount = 0;
export function permitTrafficAttempt(now = Date.now()) {
  const minute = Math.floor(now / 60_000);
  const day = Math.floor(now / 86_400_000);
  if (minute !== minuteStart) { minuteStart = minute; minuteCount = 0; }
  if (day !== dayStart) { dayStart = day; dayCount = 0; }
  if (minuteCount >= 600 || dayCount >= 10_000) return false;
  minuteCount++;
  dayCount++;
  return true;
}
