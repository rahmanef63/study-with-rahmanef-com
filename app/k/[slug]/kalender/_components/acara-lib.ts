// Kalender tab — pure helpers shared by the SERVER page and its client islands.
// No "use client" on purpose: both sides import this, and everything here is a
// pure function over numbers and strings.
//
// EVERY time in this tab is rendered in Asia/Jakarta, pinned. Two reasons:
//   1. convex/features/events/validate.ts is deliberately DST-naive ("the
//      audience is Asia/Jakarta (WIB, no DST)"), so "+7×24h" and "same wall
//      clock next week" only agree if the UI speaks the same timezone;
//   2. the upcoming list is server-rendered, and a Node process in UTC would
//      otherwise print times seven hours off for every reader.
// The label always carries "WIB" so it is never ambiguous.
import { ConvexError } from "convex/values";
import type { FunctionReturnType } from "convex/server";
import type { api } from "@convex/_generated/api";
import { communityHref } from "@/lib/community";

/** The member-aware projection both public event queries return. */
export type AcaraPublik = FunctionReturnType<
  typeof api.features.events.queries.publicListUpcoming
>[number];

const WIB = "Asia/Jakarta";

/** Thin alias so the three call sites in this tab keep one import. */
export const kalenderHref = (slug: string) => communityHref.kalender(slug);

/** Machine-readable WIB parts — the only place Intl.formatToParts is needed. */
const WIB_PARTS = new Intl.DateTimeFormat("en-CA", {
  timeZone: WIB,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

function wibParts(ms: number): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of WIB_PARTS.formatToParts(new Date(ms))) out[part.type] = part.value;
  return out;
}

/** "2026-08-09" in WIB — the day-grouping key, never shown to a human. */
export function wibDayKey(ms: number): string {
  const p = wibParts(ms);
  return `${p.year}-${p.month}-${p.day}`;
}

/**
 * epoch ms → the value shape `<input type="datetime-local">` wants
 * ("2026-08-09T19:00"), expressed in WIB so the form shows the same clock the
 * list does.
 */
export function wibInputValue(ms: number): string {
  const p = wibParts(ms);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/**
 * datetime-local → epoch ms, READ AS WIB rather than as the browser's zone.
 * A native datetime-local carries no offset, so `new Date(value)` would resolve
 * it against wherever the instructor happens to be sitting and schedule a
 * Jakarta session at the wrong hour. Pinning +07:00 keeps write and read
 * symmetrical with wibInputValue above.
 */
export function wibInputToEpoch(value: string): number | null {
  if (value === "") return null;
  const ms = Date.parse(`${value.slice(0, 16)}:00+07:00`);
  return Number.isNaN(ms) ? null : ms;
}

/** "Sabtu, 9 Agustus 2026" — Bahasa month + weekday names, no date library. */
export function labelHari(ms: number): string {
  return new Date(ms).toLocaleDateString("id-ID", {
    timeZone: WIB,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function labelJam(ms: number): string {
  return new Date(ms).toLocaleTimeString("id-ID", {
    timeZone: WIB,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

/** "19.00 WIB" or "19.00–21.00 WIB". */
export function labelRentang(startsAt: number, endsAt: number | null): string {
  const mulai = labelJam(startsAt);
  return endsAt === null ? `${mulai} WIB` : `${mulai}–${labelJam(endsAt)} WIB`;
}

export type HariAcara = { key: string; label: string; acara: AcaraPublik[] };

/**
 * Group into WIB days. Relies on the caller's order (publicListUpcoming is
 * ascending, publicListPast descending) — it never sorts, so the archive stays
 * most-recent-first for free.
 */
export function kelompokkanPerHari(acara: AcaraPublik[]): HariAcara[] {
  const hari: HariAcara[] = [];
  for (const item of acara) {
    const key = wibDayKey(item.startsAt);
    const terakhir = hari.at(-1);
    if (terakhir !== undefined && terakhir.key === key) terakhir.acara.push(item);
    else hari.push({ key, label: labelHari(item.startsAt), acara: [item] });
  }
  return hari;
}

/** ConvexError { code, message } → Bahasa copy (rr "Error handling"). */
export function pesanGagalAcara(error: unknown): string {
  if (error instanceof ConvexError && typeof error.data === "object" && error.data !== null) {
    const data = error.data as { code?: string; message?: string };
    // VALIDATION_FAILED messages are already user-facing Bahasa (validate.ts).
    if (data.code === "VALIDATION_FAILED" && data.message) return data.message;
    if (data.code === "NOT_AUTHORIZED") return "Hanya pengajar komunitas yang bisa atur jadwal.";
    if (data.code === "NOT_AUTHENTICATED") return "Sesi login kamu habis. Masuk lagi ya.";
    if (data.code === "NOT_FOUND") return "Sesi ini sudah tidak ada.";
  }
  return "Gagal menyimpan jadwal. Coba lagi sebentar lagi.";
}
