// announcements feature — pure helpers: input validation, the safe read
// projection, and the Discord message formatter. No ctx, no I/O — unit-testable
// and safe to import from either server handlers or the internal action.
import type { Doc, Id } from "../../_generated/dataModel";
import { fail } from "./errors";

/** By-design bounds (VALIDATION_FAILED on breach). listTake bounds the read. */
export const ANNOUNCEMENT_LIMITS = {
  titleMin: 3,
  titleMax: 120,
  bodyMin: 1,
  bodyMax: 5000,
  listTake: 50,
  /** Discord message hard cap is 2000 chars; body is truncated below this. */
  discordBodyMax: 1500,
} as const;

export const LIST_TAKE = ANNOUNCEMENT_LIMITS.listTake;

/**
 * Safe read shape for the member list surface. Explicit projection — the
 * announcements row has no secret of its own, but the tenant's
 * `discordWebhookUrl` must NEVER travel with an announcement, so every read
 * goes through this allowlist rather than returning the raw doc.
 */
export type AnnouncementView = {
  _id: Id<"announcements">;
  tenantId: Id<"tenants">;
  title: string;
  bodyMd: string;
  createdBy: Id<"users">;
  postedToDiscord: boolean;
  createdAt: number;
};

export function toAnnouncementView(a: Doc<"announcements">): AnnouncementView {
  return {
    _id: a._id,
    tenantId: a.tenantId,
    title: a.title,
    bodyMd: a.bodyMd,
    createdBy: a.createdBy,
    postedToDiscord: a.postedToDiscord,
    createdAt: a._creationTime,
  };
}

/** Trim + bound-check the create input. Throws VALIDATION_FAILED on breach. */
export function validateCreateInput(
  rawTitle: string,
  rawBody: string
): { title: string; bodyMd: string } {
  const title = rawTitle.trim();
  const bodyMd = rawBody.trim();
  const L = ANNOUNCEMENT_LIMITS;
  if (title.length < L.titleMin || title.length > L.titleMax) {
    fail("VALIDATION_FAILED", `Judul harus ${L.titleMin}–${L.titleMax} karakter`);
  }
  if (bodyMd.length < L.bodyMin || bodyMd.length > L.bodyMax) {
    fail("VALIDATION_FAILED", `Isi pengumuman maksimal ${L.bodyMax} karakter`);
  }
  return { title, bodyMd };
}

/**
 * Build the Discord webhook message body (`{ content }`). Pure — takes already
 * safe strings, truncates to stay under Discord's 2000-char content limit.
 */
export function formatDiscordMessage(
  title: string,
  bodyMd: string,
  tenantName: string
): string {
  const max = ANNOUNCEMENT_LIMITS.discordBodyMax;
  const body = bodyMd.length > max ? `${bodyMd.slice(0, max)}…` : bodyMd;
  return `📢 **${title}**\n\n${body}\n\n— ${tenantName}`;
}
