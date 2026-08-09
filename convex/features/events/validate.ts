// events feature — pure input validation + by-design bounds (Kalender, #31).
// No ctx and no I/O: unit-testable (validate.test.ts) and safe to import from
// any handler. Every breach throws ConvexError VALIDATION_FAILED via fail().
import { fail } from "./errors";

export const EVENT_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  descriptionMax: 2000,
  locationUrlMax: 2000,
  /** Rows returned by publicListUpcoming / publicListPast. */
  listTake: 50,
  /**
   * Index rows read before the canceledAt filter. canceledAt is NOT part of
   * by_tenant_start, so cancellations are filtered after the take — the
   * headroom over listTake keeps a run of canceled sessions from emptying the
   * page (same trick as posts.deletedAt).
   */
  scanTake: 120,
  /**
   * createRecurring hard cap. DECISIONS #31: "ulangi mingguan × N" is N
   * DISCRETE ROWS in one mutation — there is no recurrence rule in the schema
   * and there must never be one (RRULE + exceptions + timezone expansion is
   * the classic over-engineering trap for this feature).
   */
  maxRepeatWeekly: 12,
} as const;

/**
 * One week in ms, fixed. Deliberately DST-naive: the audience is Asia/Jakarta
 * (WIB, no DST), so "same wall-clock time next week" and "+7×24h" agree.
 */
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export type NewEventInput = {
  title: string;
  description?: string;
  startsAt: number;
  endsAt?: number;
  locationUrl?: string;
};

/** Normalised, storable event fields (optionals absent rather than empty). */
export type NewEventFields = {
  title: string;
  description: string | undefined;
  startsAt: number;
  endsAt: number | undefined;
  locationUrl: string | undefined;
};

/**
 * https-only, mirroring isValidDiscordInviteUrl in
 * convex/features/tenants/helpers.ts. The link is rendered as a click-through
 * CTA, so `http:`, `javascript:` and `data:` are rejected at WRITE time rather
 * than sanitised at render time. Per DATA-MODEL this is a Discord/YouTube link
 * — never a physical address.
 */
export function isValidLocationUrl(url: string): boolean {
  return /^https:\/\/[^\s]+$/.test(url) && url.length <= EVENT_LIMITS.locationUrlMax;
}

/** Title: 3–120 chars after trim. */
export function normalizeTitle(raw: string): string {
  const title = raw.trim();
  if (title.length < EVENT_LIMITS.titleMin || title.length > EVENT_LIMITS.titleMax) {
    fail(
      "VALIDATION_FAILED",
      `Judul acara harus ${EVENT_LIMITS.titleMin}–${EVENT_LIMITS.titleMax} karakter`
    );
  }
  return title;
}

/** Description: max 2000 chars after trim; "" (or whitespace) clears it. */
export function normalizeDescription(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const description = raw.trim();
  if (description.length > EVENT_LIMITS.descriptionMax) {
    fail("VALIDATION_FAILED", `Deskripsi acara maksimal ${EVENT_LIMITS.descriptionMax} karakter`);
  }
  return description === "" ? undefined : description;
}

/** Location link: "" clears it, anything else must pass isValidLocationUrl. */
export function normalizeLocationUrl(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const url = raw.trim();
  if (url === "") return undefined;
  if (!isValidLocationUrl(url)) {
    fail("VALIDATION_FAILED", "Link acara harus URL https");
  }
  return url;
}

/** A sane epoch-ms integer (rejects NaN, Infinity, fractions, ≤ 0). */
export function assertTimestamp(value: number, message: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) fail("VALIDATION_FAILED", message);
}

/** startsAt on CREATE: valid epoch ms AND strictly in the future. */
export function assertFutureStart(startsAt: number, now: number): void {
  assertTimestamp(startsAt, "Waktu mulai tidak valid");
  if (startsAt <= now) fail("VALIDATION_FAILED", "Waktu mulai harus di masa depan");
}

/** endsAt (when set) must be a valid epoch ms strictly after startsAt. */
export function assertEndsAt(startsAt: number, endsAt: number | undefined): void {
  if (endsAt === undefined) return;
  assertTimestamp(endsAt, "Waktu selesai tidak valid");
  if (endsAt <= startsAt) {
    fail("VALIDATION_FAILED", "Waktu selesai harus setelah waktu mulai");
  }
}

/** repeatWeekly: an integer 1..maxRepeatWeekly (1 = just the first session). */
export function assertRepeatWeekly(repeatWeekly: number): void {
  if (
    !Number.isSafeInteger(repeatWeekly) ||
    repeatWeekly < 1 ||
    repeatWeekly > EVENT_LIMITS.maxRepeatWeekly
  ) {
    fail(
      "VALIDATION_FAILED",
      `Pengulangan mingguan harus 1–${EVENT_LIMITS.maxRepeatWeekly} kali`
    );
  }
}

/** Full create-time validation, shared by `create` and `createRecurring`. */
export function validateNewEvent(input: NewEventInput, now: number): NewEventFields {
  const title = normalizeTitle(input.title);
  assertFutureStart(input.startsAt, now);
  assertEndsAt(input.startsAt, input.endsAt);
  return {
    title,
    description: normalizeDescription(input.description),
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    locationUrl: normalizeLocationUrl(input.locationUrl),
  };
}

export type EventPatchInput = {
  title?: string;
  description?: string;
  startsAt?: number;
  endsAt?: number;
  locationUrl?: string;
};

export type EventPatch = Partial<NewEventFields>;

/**
 * Build an update patch. `undefined` = leave unchanged; "" clears description /
 * locationUrl (mirrors buildProfilePatch in tenants/helpers.ts).
 *
 * startsAt MAY move into the past here — fixing the recorded time of a session
 * that already happened is legitimate; only `create` demands a future start.
 * endsAt is checked against the EFFECTIVE start (the new one when supplied,
 * otherwise the stored one) and cannot be cleared: an event that must become
 * open-ended is a cancel + create, not a patch.
 */
export function buildEventPatch(
  current: { startsAt: number; endsAt?: number },
  input: EventPatchInput
): EventPatch {
  const patch: EventPatch = {};
  if (input.title !== undefined) patch.title = normalizeTitle(input.title);
  if (input.description !== undefined) patch.description = normalizeDescription(input.description);
  if (input.locationUrl !== undefined) patch.locationUrl = normalizeLocationUrl(input.locationUrl);
  if (input.startsAt !== undefined) {
    assertTimestamp(input.startsAt, "Waktu mulai tidak valid");
    patch.startsAt = input.startsAt;
  }
  if (input.endsAt !== undefined) patch.endsAt = input.endsAt;
  assertEndsAt(input.startsAt ?? current.startsAt, input.endsAt ?? current.endsAt);
  return patch;
}
