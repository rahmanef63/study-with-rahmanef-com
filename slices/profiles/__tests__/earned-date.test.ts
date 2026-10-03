import { expect, test } from "vitest";
import { formatEarnedDate } from "../lib/earned-date";

test("earned dates do not change between UTC server and Indonesian devices", () => {
  const beforeUtcMidnight = Date.parse("2026-07-08T23:00:00Z");
  expect(formatEarnedDate(beforeUtcMidnight)).toBe("9 Juli 2026");
  expect(formatEarnedDate(beforeUtcMidnight, "short")).toBe("9 Jul 2026");
});
