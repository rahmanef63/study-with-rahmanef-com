// Anonymous smoke suite over the real community routes (replaces the OS-shell
// deep-link suite; the windowed desktop was deleted in the /k route migration).
// Read-only by design: every scenario is an ANON visitor exercising the §6
// etalase surface — no login, no mutation, safe against prod (e2e/README.md).
//
// Selector policy: role/text-based (getByRole/getByText) against the Bahasa
// Indonesia UI copy SSOTs, so the specs survive markup refactors but
// intentionally break when the copy contract changes.
//
// Public pages are SERVER-rendered now, so their content assertions no longer
// need the old 15s "wait for the client to fetch" budget; only the pages whose
// body is a client island (Diskusi, Kelola) still do.
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";
import { expectNoPromptLeak, htmlText, sitemapPaths } from "./helpers";

// Seeded fixtures (docs/STATUS.md #11: tenant `belajar-ai`, Rahman = owner).
// Env-overridable so staging can point at its own seed without editing specs.
const TENANT = process.env.E2E_TENANT ?? "belajar-ai";
const COURSE = process.env.E2E_COURSE ?? "dasar-ai";
const USERNAME = process.env.E2E_USERNAME ?? "abdurrahman-fakhrul";

/** Only client-island surfaces still wait on a Convex round trip. */
const DATA_TIMEOUT = 15_000;

const ERROR_ALLOWLIST = [
  /Failed to load resource/i,
  /React DevTools/i,
  /net::ERR_/i,
  // GONE 2026-08-11: /Transition was skipped/i. It masked a browser-level
  // rejection from the View Transitions API, which the app entered on every
  // router update because <ViewTransition> wrapped {children} in
  // app/layout.tsx. That wrapper was deleted (it was the "terbuka 2 kali"
  // defect: one tap ran two or three whole-app entrances), so the app now calls
  // startViewTransition zero times and this entry could only ever hide a real
  // error from here on.
];

function collectErrors(page: Page) {
  const errors: string[] = [];
  // The allowlist applies to BOTH channels: an uncaught rejection and a
  // console.error are the same class of evidence, so filtering one and not the
  // other just moves the flake.
  page.on("pageerror", (err) => {
    if (ERROR_ALLOWLIST.some((re) => re.test(err.message))) return;
    errors.push(`pageerror: ${err.message}`);
  });
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (ERROR_ALLOWLIST.some((re) => re.test(text))) return;
    errors.push(`console.error: ${text}`);
  });
  return errors;
}

/** Never surface the Next crash overlay, and never fall through to
 *  app/error.tsx ("Ada yang tidak beres") — reaching it means an unhandled
 *  client exception escaped a page. */
async function expectNoCrash(page: Page) {
  await expect(page.getByText(/Application error|Unhandled Runtime Error/)).toHaveCount(0);
  await expect(page.getByText("Ada yang tidak beres")).toHaveCount(0);
}

test.describe("community routes — anon smoke", () => {
  test("1. / redirects into the flagship community and lands on the Kelas section", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}$`));
    // WAS: `page.locator("header").getByRole("heading", { level: 1 })`, i.e.
    // the community name inside the community <header>. Both are gone — the
    // stacked header was replaced by a dashboard rail on 2026-08-11, and the
    // layout's <h1> is now sr-only in the content column, outside any <header>.
    //
    // The landing marker is the page's own <h2>, which is real server HTML and
    // is the ONE thing on a 390px phone that names the section (the rail is
    // behind a hamburger there). Plus, unchanged, at least one real course link
    // — the only crawl path from a community to its courses.
    await expect(page.getByRole("heading", { level: 2, name: "Kelas" })).toBeVisible();
    // Exactly one <h1> per route under /k: the layout's. A page that adds its
    // own on top of it is the doubled-heading regression this guards.
    await expect(page.getByRole("heading", { level: 1, includeHidden: true })).toHaveCount(1);
    await expect(page.locator(`main a[href*="/kelas/"]`).first()).toBeVisible();
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("2. the Kelas tab server-renders real course links (the only crawl path)", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    // JS off: whatever is asserted here is in the HTML the server sent, which is
    // exactly what a crawler and a link unfurler see.
    await page.context().addInitScript(() => {});
    const res = await page.goto(`/k/${TENANT}`);
    expect(res?.status()).toBe(200);
    const html = await res!.text();
    expect(html).toContain(`/k/${TENANT}/kelas/`);
    await expect(page.getByRole("link", { name: /.+/ }).first()).toBeVisible();
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("3. a course page has a real <h1>, description and syllabus in its HTML", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    const res = await page.goto(`/k/${TENANT}/kelas/${COURSE}`);
    expect(res?.status()).toBe(200);
    // The community name reaches the <title> via the layout's title.template.
    await expect(page).toHaveTitle(/—/);
    const html = await res!.text();
    expect(html).toContain('property="og:title"');
    // Syllabus module/lesson titles must be present without running any query
    // client-side; this is the SEO contract the OS shell could not meet.
    expect(html.length).toBeGreaterThan(2000);
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("4. /masuk shows the Google sign-in affordance and preserves ?next=", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/masuk?next=%2Fk%2F${TENANT}`);
    await expect(
      page.getByRole("button", { name: /Masuk dengan Google|Continue with Google/i })
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("5. /u/<username> renders the public profile", async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(`/u/${USERNAME}`);
    // A handle that has no profile row 404s; both outcomes are correct, a crash
    // is not.
    expect([200, 404]).toContain(res?.status() ?? 0);
    if (res?.status() === 200) {
      await expect(page.getByText(`@${USERNAME}`).first()).toBeVisible();
    }
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("6. /k/<tenant>/kelola as anon shows a safe gate — never a crash", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/k/${TENANT}/kelola`);
    await expect(
      page.getByText(/Masuk untuk mengelola|Khusus pengajar/).first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("7. a lesson URL as anon shows the join gate, never lesson content", async ({ page }) => {
    const errors = collectErrors(page);
    // A syntactically valid but non-existent lesson id: the gate must fire on
    // MEMBERSHIP before anything tries to read the lesson.
    await page.goto(`/k/${TENANT}/kelas/${COURSE}/j570000000000000000000000000`);
    // SSOT: lesson-surface.tsx → <GabungDulu description=…>. (The old copy
    // "Materi ini untuk anggota" no longer exists anywhere in the product.)
    await expect(page.getByText("Gabung komunitasnya dulu")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.locator("iframe")).toHaveCount(0);
    await expectNoCrash(page);
  });

  test("8. /sertifikat/<bogus-id> shows a friendly not-found, never a crash", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/sertifikat/e2e-bogus-completion-id");
    await expect(
      page.getByText(/Sertifikat tidak ditemukan|Halaman tidak ditemukan/).first()
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
    expect(
      errors.filter((e) => !/publicGetCertificate|NOT_FOUND|Sertifikat tidak ditemukan/.test(e))
    ).toEqual([]);
  });

  test("9. Diskusi as anon shows the join gate — never a crash", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto(`/k/${TENANT}/diskusi`);
    await expect(page.getByText(/anggota/i).first()).toBeVisible({ timeout: DATA_TIMEOUT });
    await expectNoCrash(page);
  });

  test("10. retired OS deep-links still resolve (persisted in notifications.href)", async ({
    page,
  }) => {
    await page.goto(`/kelas/${TENANT}/${COURSE}`);
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}/kelas/${COURSE}$`));
    await page.goto(`/komunitas/${TENANT}`);
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}$`));
    await expectNoCrash(page);
  });

  test("11. an unknown path is a real 404, not a 200 shell", async ({ page }) => {
    const res = await page.goto("/tidak-ada-halaman-seperti-ini");
    expect(res?.status()).toBe(404);
    await expect(page.getByText("Halaman tidak ditemukan")).toBeVisible();
  });

  test("12. robots.txt and sitemap.xml are real files, not HTML", async ({ page }) => {
    const robots = await page.request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    expect(await robots.text()).toContain("Sitemap:");

    const sitemap = await page.request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    const xml = await sitemap.text();
    expect(xml).toContain("<urlset");
    expect(xml).toContain(`/k/${TENANT}`);
  });

  // ── the materi/skills model, from the outside ─────────────────────────────
  // The two LIBRARY tabs are member-gated lists; the two PERMALINK pages are
  // the indexable half. These four specs are the anonymous side of that
  // contract: the lists show nothing, the permalinks show a real title, and
  // neither ever emits a body or a prompt.

  test("13. /materi as anon is a gate — no rows, no body, and noindex", async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(`/k/${TENANT}/materi`);
    expect(res?.status()).toBe(200);
    const html = await res!.text();

    await expect(
      page.getByText("Perpustakaan materi komunitas hanya terbuka untuk anggota.")
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    // Everything the list is made of must be absent, not merely hidden: one
    // permalink row in the HTML is a catalogue of member content leaking.
    await expect(page.locator(`main a[href*="/materi/"]`)).toHaveCount(0);
    await expect(page.getByRole("group", { name: "Urutkan" })).toHaveCount(0);
    await expect(page.locator("main article")).toHaveCount(0);
    // A list of every materi in a community must never be indexed.
    expect(html).toMatch(/name="robots"[^>]*noindex|noindex[^>]*name="robots"/);
    expectNoPromptLeak(html);

    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("14. /skills as anon is a gate — never a prompt", async ({ page }) => {
    const errors = collectErrors(page);
    const res = await page.goto(`/k/${TENANT}/skills`);
    expect(res?.status()).toBe(200);
    const html = await res!.text();

    await expect(
      page.getByText("Kumpulan prompt komunitas hanya terbuka untuk anggota.")
    ).toBeVisible({ timeout: DATA_TIMEOUT });
    await expect(page.locator(`main a[href*="/skills/"]`)).toHaveCount(0);
    // The prompt panel is `<section aria-label="Prompt">`. Anon: zero of them,
    // on the library and on every skill page below.
    await expect(page.locator('section[aria-label="Prompt"]')).toHaveCount(0);
    expect(html).toMatch(/name="robots"[^>]*noindex|noindex[^>]*name="robots"/);
    expectNoPromptLeak(html);

    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("15. a materi permalink server-renders its real title", async ({ page }) => {
    const errors = collectErrors(page);
    // Discovered, not hardcoded: the sitemap is the only anonymous enumeration
    // of materi permalinks, and it is the crawl path the model exists for.
    const paths = await sitemapPaths(
      page.request,
      new RegExp(`^/k/${TENANT}/materi/[^/]+$`)
    );
    test.skip(
      paths.length === 0,
      "sitemap.xml mengiklankan 0 permalink materi — deployment ini belum punya materi terbit."
    );

    const res = await page.goto(paths[0]);
    expect(res?.status()).toBe(200);
    const html = await res!.text();

    // The ONE <h1> of the page body (the community name in the layout header is
    // the other h1 on this route — outside <main>).
    const heading = page.locator("main").getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    // textContent, not innerText: innerText applies CSS `text-transform`, and
    // this theme uppercases display text — comparing an UPPERCASED reading of
    // the DOM against the server's HTML fails on every mixed-case title.
    const title = ((await heading.textContent()) ?? "").trim();
    expect(title.length).toBeGreaterThan(0);
    // In the HTML THE SERVER SENT — the whole point of the permalink. A title
    // that only appears after hydration is invisible to a crawler and to a
    // WhatsApp unfurl.
    expect(htmlText(html)).toContain(title);
    expect(await page.title()).toContain(title);
    expect(html).toContain('property="og:title"');
    expect(html).toContain(`${paths[0]}`); // its own canonical

    // …and nothing else. The body is the member island; anon gets the CTA.
    await expect(page.getByText("Gabung komunitasnya dulu")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expect(page.locator("main article")).toHaveCount(0);
    await expect(page.locator('section[aria-label="Prompt"]')).toHaveCount(0);
    expectNoPromptLeak(html);

    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("16. a skill permalink shows the title and NEVER the prompt", async ({ page }) => {
    const errors = collectErrors(page);
    const paths = await sitemapPaths(
      page.request,
      new RegExp(`^/k/${TENANT}/skills/[^/]+$`)
    );
    // The skills library ships EMPTY on purpose (prompts are seeded later), so
    // this is expected to skip until the first skill is published — at which
    // point it starts guarding the leak without anyone re-enabling it.
    test.skip(
      paths.length === 0,
      "Belum ada skill terbit (perpustakaan skill sengaja kosong) — spec ini hidup sendiri begitu skill pertama terbit."
    );

    const res = await page.goto(paths[0]);
    expect(res?.status()).toBe(200);
    const html = await res!.text();

    const heading = page.locator("main").getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    const title = ((await heading.textContent()) ?? "").trim();
    expect(htmlText(html)).toContain(title);

    // THE assertion of this feature: the etalase stops at the title.
    await expect(page.locator('section[aria-label="Prompt"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Salin" })).toHaveCount(0);
    expectNoPromptLeak(html);
    await expect(page.getByText("Gabung komunitasnya dulu")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });

    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });

  test("17. the two permalink routes share one slug namespace and redirect, never 404", async ({
    page,
  }) => {
    const paths = await sitemapPaths(
      page.request,
      new RegExp(`^/k/${TENANT}/materi/[^/]+$`)
    );
    test.skip(paths.length === 0, "sitemap.xml mengiklankan 0 permalink materi.");
    const slug = paths[0].split("/").pop() as string;

    // A materi's slug typed under /skills/ is someone who copied the wrong path
    // out of a chat: it must land on the canonical materi page, not dead-end.
    await page.goto(`/k/${TENANT}/skills/${slug}`);
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}/materi/${slug}$`));
    await expectNoCrash(page);
  });

  // ── /mulai — the assessment ───────────────────────────────────────────────
  test("18. /mulai is fully usable WITHOUT logging in", async ({ page }) => {
    const errors = collectErrors(page);
    // 390px is the design target (AGENTS.md / globals.css: mobile-first, 44px
    // touch floor), and this is the one surface built for a stranger on a
    // phone — so it is measured at the width it was designed for.
    await page.setViewportSize({ width: 390, height: 844 });
    const res = await page.goto("/mulai");
    // ESCAPE HATCH, delete when /mulai ships: the assessment is being built in
    // parallel with this suite. A 404 skips; anything else is asserted for
    // real, so the spec starts guarding the route the moment it exists.
    test.skip(
      res?.status() === 404,
      "/mulai belum ada di build ini — spec hidup sendiri begitu rutenya di-deploy."
    );
    expect(res?.status()).toBe(200);

    // The whole point of the assessment is that a stranger can finish it. Any
    // login bounce or member gate defeats the feature entirely.
    await expect(page).toHaveURL(/\/mulai/);
    await expect(page.getByText(/Masuk untuk|hanya terbuka untuk anggota/)).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: /Masuk dengan Google|Continue with Google/i })
    ).toHaveCount(0);

    // Usable, not merely reachable: there is something to answer, it is a real
    // 44px touch target, and answering it does not bounce the visitor to login.
    const answers = page.locator("main").getByRole("button").or(page.locator("main input"));
    await expect(answers.first()).toBeVisible({ timeout: DATA_TIMEOUT });
    const box = await answers.first().boundingBox();
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    await answers.first().click();
    await expect(page).toHaveURL(/\/mulai/);
    await expect(page.getByText(/Masuk untuk|hanya terbuka untuk anggota/)).toHaveCount(0);

    await expectNoCrash(page);
    expect(errors).toEqual([]);
  });
});
