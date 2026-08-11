// e2e — shared fixtures for every spec in this folder.
//
// NOT a spec file, and it must never become one: Playwright only collects
// `*.spec.ts` / `*.test.ts`, so nothing here runs on its own. Everything below
// is either an env-derived constant (so one export changes the whole suite's
// target) or an assertion that more than one spec needs to make identically.
//
// The rule this file exists to enforce: an assertion that appears in two specs
// must be the SAME assertion. Three hand-copied crash guards drift into three
// different definitions of "the page crashed", and then a real crash passes.
import { expect, type APIRequestContext, type Page } from "@playwright/test";

/** Seeded fixtures (docs/STATUS.md #11). Env-overridable so staging can point
 *  at its own seed without editing a spec. */
export const TENANT = process.env.E2E_TENANT ?? "belajar-ai";
export const COURSE = process.env.E2E_COURSE ?? "dasar-ai";
export const USERNAME = process.env.E2E_USERNAME ?? "abdurrahman-fakhrul";

/** Only client-island surfaces wait on a Convex round trip; server-rendered
 *  HTML is asserted with Playwright's default timeout. */
export const DATA_TIMEOUT = 15_000;

const IS_PROD = (process.env.E2E_BASE_URL ?? "").includes("study-with.rahmanef.com");

/**
 * The authed suite REFUSES prod unless told otherwise (e2e/README.md: authed =
 * local/staging). Every `*.auth.spec.ts` opens with
 * `test.beforeEach(() => test.skip(DENY_PROD_AUTH, DENY_PROD_AUTH_REASON))`.
 * The specs are read-only anyway; the guard is there so that stays a choice
 * someone makes on purpose rather than a default nobody noticed.
 */
export const DENY_PROD_AUTH = IS_PROD && process.env.E2E_ALLOW_PROD_AUTH !== "1";
export const DENY_PROD_AUTH_REASON =
  "Authed suite menolak prod (kebijakan e2e/README.md) — set E2E_ALLOW_PROD_AUTH=1 hanya bila sadar risikonya (tetap read-only).";

/** Never surface the Next crash overlay, and never fall through to
 *  app/error.tsx ("Ada yang tidak beres") — reaching it means an unhandled
 *  exception escaped a page. */
export async function expectNoCrash(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
  await expect(page.getByText("Ada yang tidak beres")).toHaveCount(0);
}

/**
 * Every string in the app that means "you are not a member / not logged in".
 * An authenticated spec asserts ZERO of these — a member seeing a join gate is
 * the exact failure the authed suite exists to catch, and the copies live in
 * four different SSOTs (materi copy.ts, GabungDulu call sites, kelola-console),
 * so a spec that only knows one of them can pass while the session is dead.
 *
 * CALL IT AFTER a positive marker is already visible. `toHaveCount(0)` is true
 * of a page that has not rendered yet, so on its own it proves nothing.
 */
export const GATE_COPY =
  /hanya terbuka untuk anggota|Gabung komunitasnya dulu|Masuk untuk|Materi ini untuk anggota|Khusus pengajar/;

export async function expectNoGate(page: Page) {
  await expect(page.getByText(GATE_COPY)).toHaveCount(0);
}

/** The prompt of a skill is the single most member-only string in the product.
 *  `promptText` is the field name on the member projection; if it ever shows
 *  up in anonymous HTML (rendered, or serialised into the flight payload) the
 *  etalase has grown a leak. */
export function expectNoPromptLeak(html: string) {
  expect(html).not.toContain("promptText");
  expect(html).not.toContain("promptPreview");
}

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Server HTML → the text a reader would see, so a spec can assert that a
 *  string is IN THE HTML THE SERVER SENT (the SSR contract) rather than merely
 *  on the page after hydration. */
export function htmlText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[#a-zA-Z0-9]+;/g, (e) => ENTITIES[e] ?? " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Paths advertised by /sitemap.xml that match `re`.
 *
 * The suite discovers materi and skill permalinks this way instead of hard-
 * coding a slug: the library pages are `robots: { index: false }` and
 * member-gated, so the sitemap is the ONLY anonymous enumeration of them —
 * which is also exactly the crawl path the materi model was built for. If it
 * is empty, the specs that need a permalink skip and say so.
 */
export async function sitemapPaths(
  request: APIRequestContext,
  re: RegExp
): Promise<string[]> {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((match) => match[1].replace(/&amp;/g, "&"))
    .map((url) => {
      try {
        return new URL(url).pathname;
      } catch {
        return url;
      }
    })
    .filter((path) => re.test(path));
}
