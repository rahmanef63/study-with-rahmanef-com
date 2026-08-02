// formatRelativeTime specs (pure lib, injectable now).
import { describe, expect, test } from "vitest";
import { formatRelativeTime } from "../lib/time";

const NOW = new Date("2026-07-09T12:00:00Z").getTime();

describe("formatRelativeTime", () => {
  test("under a minute → baru saja (future-safe: clamped to 0)", () => {
    expect(formatRelativeTime(NOW - 30_000, NOW)).toBe("baru saja");
    expect(formatRelativeTime(NOW + 5_000, NOW)).toBe("baru saja");
  });

  test("minutes / hours / days", () => {
    expect(formatRelativeTime(NOW - 5 * 60_000, NOW)).toBe("5 menit lalu");
    expect(formatRelativeTime(NOW - 3 * 3_600_000, NOW)).toBe("3 jam lalu");
    expect(formatRelativeTime(NOW - 2 * 86_400_000, NOW)).toBe("2 hari lalu");
  });

  test("a week or older → absolute id-ID date", () => {
    const out = formatRelativeTime(NOW - 8 * 86_400_000, NOW);
    expect(out).toMatch(/2026/);
    expect(out).not.toMatch(/lalu/);
  });
});
