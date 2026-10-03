import type { ActivityInput } from "./contract";

const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
const COMMUNITY = new RegExp(`^/k/${SLUG}(?:/(?:materi|skills)(?:/${SLUG})?|/kelas(?:/${SLUG}(?:/[a-z0-9]+|/kuis/[a-z0-9]+)?)?|/(?:diskusi|anggota|peringkat|tentang|cari|kalender)|/post/[a-z0-9]+)?$`);

/** Collect learning navigation, never administrative, account or private callback paths. */
export function allowedUserActivityPath(value: string): boolean {
  return value.length <= 256 && !/[?#%\\\s]/.test(value)
    && (["/", "/home", "/komunitas", "/roadmap", "/mulai"].includes(value) || COMMUNITY.test(value));
}

export function validActivityTarget(value: string): boolean {
  if (allowedUserActivityPath(value)) return true;
  if (value.length > 512) return false;
  try {
    const url = new URL(value);
    if (["study-with.rahmanef.com", "localhost"].includes(url.hostname) && !allowedUserActivityPath(url.pathname)) return false;
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash
      && !url.port && !/[\s\\%]/.test(value) && url.hostname.includes(".")
      && !/^(?:localhost|127\.|0\.|10\.|192\.168\.|169\.254\.)/i.test(url.hostname)
      && !/(?:auth|oauth|callback|token|reset|signout)/i.test(url.pathname);
  } catch { return false; }
}

export function validActivity(input: ActivityInput): boolean {
  if (!allowedUserActivityPath(input.path)) return false;
  if (input.kind === "click" ? !input.target || !validActivityTarget(input.target) : input.target !== undefined) return false;
  const text = (value: string | undefined, pattern: RegExp) => value === undefined || pattern.test(value);
  if (!text(input.referrerHost, /^(?=.{1,80}$)[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/)
    || !text(input.utmSource, /^[a-z0-9_-]{1,80}$/) || !text(input.utmCampaign, /^[a-z0-9_-]{1,80}$/)
    || !text(input.country, /^(?!XX)[A-Z]{2}$/)) return false;
  if (input.city !== undefined && (input.city.length < 1 || input.city.length > 100
    || input.city !== input.city.trim() || !/^[\p{L}\p{M}\p{N} .,'’-]+$/u.test(input.city))) return false;
  return text(input.browser, /^(?:Chrome|Firefox|Edge|Safari|Opera|Samsung Internet|Other|Unknown)$/)
    && text(input.os, /^(?:Android|iOS|Windows|macOS|Linux|ChromeOS|Other|Unknown)$/);
}

/** Defense in depth: the authenticated Next proxy alone can supply server-derived geolocation. */
export function validActivitySecret(provided: string): boolean {
  const secret = process.env.ANALYTICS_INGEST_SECRET;
  if (!secret || secret.length < 32 || secret.length > 256 || secret.length !== provided.length) return false;
  let difference = 0;
  for (let i = 0; i < secret.length; i++) difference |= secret.charCodeAt(i) ^ provided.charCodeAt(i);
  return difference === 0;
}
