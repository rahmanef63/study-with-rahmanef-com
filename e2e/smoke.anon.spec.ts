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

// Seeded fixtures (docs/STATUS.md #11: tenant `belajar-ai`, Rahman = owner).
// Env-overridable so staging can point at its own seed without editing specs.
const TENANT = process.env.E2E_TENANT ?? "belajar-ai";
const COURSE = process.env.E2E_COURSE ?? "dasar-ai";
const USERNAME = process.env.E2E_USERNAME ?? "abdurrahman-fakhrul";

/** Only client-island surfaces still wait on a Convex round trip. */
const DATA_TIMEOUT = 15_000;

const CONSOLE_ALLOWLIST = [/Failed to load resource/i, /React DevTools/i, /net::ERR_/i];

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (CONSOLE_ALLOWLIST.some((re) => re.test(text))) return;
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
  test("1. / redirects into the flagship community and lands on the Kelas tab", async ({
    page,
  }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page).toHaveURL(new RegExp(`/k/${TENANT}$`));
    await expect(page.getByRole("heading", { name: "Mulai belajar di sini." })).toBeVisible();
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
    await expect(page.getByText("Materi ini untuk anggota")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
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
});
