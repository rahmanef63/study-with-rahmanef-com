// courses feature — input validation + by-design bounds (docs/DATA-MODEL.md
// "Catatan keamanan #3": lessons/course ≤ 200, modules/course ≤ 30).
// All checks throw ConvexError VALIDATION_FAILED via fail().
import { fail } from "./errors";

// Bounds — keep in sync with slices/courses/config/limits.ts (UI copies).
export const MAX_MODULES_PER_COURSE = 30;
export const MAX_LESSONS_PER_COURSE = 200;
export const MAX_LINKS_PER_LESSON = 20;
export const LIST_TAKE = 50;
export const MANAGE_LIST_TAKE = 100;

/**
 * P0 (docs/AGENT-PROMPTS.md gamma): youtubeVideoId is an 11-char YouTube ID —
 * NEVER a full URL. Rejecting anything outside [A-Za-z0-9_-]{11} prevents
 * arbitrary-domain embeds; the iframe src is composed server-agnostically from
 * a fixed youtube-nocookie.com prefix on the client.
 */
export const YOUTUBE_ID_RE = /^[A-Za-z0-9_-]{11}$/;

export function assertYoutubeVideoId(id: string): void {
  if (!YOUTUBE_ID_RE.test(id)) {
    fail(
      "VALIDATION_FAILED",
      "ID video YouTube tidak valid — masukkan ID 11 karakter, bukan URL penuh"
    );
  }
}

/** Course slug: lowercase kebab-case, 3–64 chars (mirrors /t/[slug] rules). */
const COURSE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function assertCourseSlug(slug: string): void {
  if (slug.length < 3 || slug.length > 64 || !COURSE_SLUG_RE.test(slug)) {
    fail(
      "VALIDATION_FAILED",
      "Slug kelas harus 3–64 karakter huruf kecil/angka dipisah tanda minus"
    );
  }
}

export function assertTitle(title: string, label: string): void {
  const t = title.trim();
  if (t.length < 3 || t.length > 120) {
    fail("VALIDATION_FAILED", `Judul ${label} harus 3–120 karakter`);
  }
}

export function assertDescription(description: string): void {
  if (description.trim().length < 1 || description.length > 2000) {
    fail("VALIDATION_FAILED", "Deskripsi wajib diisi (maks. 2000 karakter)");
  }
}

/** contentMd is required by schema; cap to keep documents bounded. */
export function assertContentMd(contentMd: string): void {
  if (contentMd.length > 50_000) {
    fail("VALIDATION_FAILED", "Materi terlalu panjang (maks. 50.000 karakter)");
  }
}

/** Resource links: bounded count, http(s) URLs only, labelled. */
export function assertLinks(links: Array<{ label: string; url: string }>): void {
  if (links.length > MAX_LINKS_PER_LESSON) {
    fail("VALIDATION_FAILED", `Maksimal ${MAX_LINKS_PER_LESSON} link per lesson`);
  }
  for (const link of links) {
    const label = link.label.trim();
    if (label.length < 1 || label.length > 100) {
      fail("VALIDATION_FAILED", "Label link harus 1–100 karakter");
    }
    if (!/^https?:\/\/.+/.test(link.url) || link.url.length > 2000) {
      fail("VALIDATION_FAILED", "URL link harus diawali http:// atau https://");
    }
  }
}

/** Optional cover image URL: http(s) only when present. */
export function assertCoverImageUrl(url: string): void {
  if (!/^https?:\/\/.+/.test(url) || url.length > 2000) {
    fail("VALIDATION_FAILED", "URL cover harus diawali http:// atau https://");
  }
}
