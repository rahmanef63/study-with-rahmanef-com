/// <reference types="vite/client" />
// The day key is the whole anti-spam mechanism (one row per member per materi
// per day), so its boundary behaviour is worth pinning down without a database.
import { expect, test } from "vitest";
import { JAKARTA_OFFSET_MS, dayKey, dayWindow, weekStartMs, weekWindow } from "./day";

const utc = (iso: string) => Date.parse(iso);

test("dayKey: WIB, not UTC — 23:00 UTC is already tomorrow in Jakarta", () => {
  expect(dayKey(utc("2026-08-11T23:00:00Z"))).toBe("2026-08-12");
  expect(dayKey(utc("2026-08-11T16:59:59Z"))).toBe("2026-08-11");
  // 17:00Z is exactly 00:00 WIB — the rollover instant belongs to the new day.
  expect(dayKey(utc("2026-08-11T17:00:00Z"))).toBe("2026-08-12");
});

test("dayKey: an evening of Indonesian study time is ONE day", () => {
  const evening = ["T12:00:00Z", "T14:30:00Z", "T16:45:00Z"].map((time) =>
    dayKey(utc(`2026-08-11${time}`))
  );
  expect(new Set(evening).size).toBe(1);
});

test("dayKey: sorts lexicographically in chronological order (index range relies on it)", () => {
  const keys = [
    dayKey(utc("2026-01-09T05:00:00Z")),
    dayKey(utc("2026-01-10T05:00:00Z")),
    dayKey(utc("2026-02-01T05:00:00Z")),
    dayKey(utc("2026-12-31T05:00:00Z")),
  ];
  expect([...keys].sort()).toEqual(keys);
});

test("weekWindow: inclusive 7-day span ending today", () => {
  const now = utc("2026-08-11T05:00:00Z");
  expect(weekWindow(now)).toEqual({ from: "2026-08-05", to: "2026-08-11" });
});

test("dayWindow: 1 day is today only; 0 and negatives clamp to today", () => {
  const now = utc("2026-08-11T05:00:00Z");
  expect(dayWindow(now, 1)).toEqual({ from: "2026-08-11", to: "2026-08-11" });
  expect(dayWindow(now, 0)).toEqual({ from: "2026-08-11", to: "2026-08-11" });
  expect(dayWindow(now, -5)).toEqual({ from: "2026-08-11", to: "2026-08-11" });
});

test("weekStartMs: midnight WIB six days back, and it agrees with weekWindow", () => {
  const now = utc("2026-08-11T05:00:00Z");
  const start = weekStartMs(now);
  expect(dayKey(start)).toBe(weekWindow(now).from);
  // Exactly midnight WIB = 17:00Z the previous calendar day.
  expect(new Date(start + JAKARTA_OFFSET_MS).toISOString()).toBe("2026-08-05T00:00:00.000Z");
  expect(start).toBeLessThanOrEqual(now);
});
