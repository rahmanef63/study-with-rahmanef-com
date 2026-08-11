// Authenticated MEMBER coverage of the materi + skills libraries — the two
// surfaces the /k route migration shipped and nobody has ever verified from a
// browser, because every read behind them is `requireTenantRole(member)` and
// the anon suite can only ever see their gate.
//
// Runs in the "chromium-auth" project, which playwright.config.ts registers
// ONLY when e2e/.auth/user.json exists (recipe: e2e/README.md). Without a
// recorded session this file is matched by no project at all — the suite stays
// anon-only and green rather than red.
//
// READ-ONLY. Nothing here writes: it navigates, it types into filter boxes, it
// toggles a client-side sort. The one thing it deliberately does NOT do is
// press "Salin" on a prompt — that is a clipboard permission prompt, not a
// coverage gain. Prod is refused unless E2E_ALLOW_PROD_AUTH=1.
//
// Sibling of member.auth.spec.ts (A1–A5: session, notifikasi, cari, lesson
// player, diskusi). This file is B1–B8; kelola.auth.spec.ts is C1–C4.
import { test, expect, type Page } from "@playwright/test";
import {
  DATA_TIMEOUT,
  DENY_PROD_AUTH,
  DENY_PROD_AUTH_REASON,
  TENANT,
  expectNoCrash,
  expectNoGate,
  sitemapPaths,
} from "./helpers";

test.beforeEach(() => {
  test.skip(DENY_PROD_AUTH, DENY_PROD_AUTH_REASON);
});

/** The library has landed when its sort control is on screen — the one control
 *  that exists only once rows are rendered. Returns false for a community whose
 *  library is genuinely empty, so a spec can skip instead of failing on a seed
 *  it does not own. */
async function libraryLoaded(page: Page, emptyCopy: RegExp): Promise<boolean> {
  const sort = page.getByRole("group", { name: "Urutkan" });
  await expect(sort.or(page.getByText(emptyCopy)).first()).toBeVisible({
    timeout: DATA_TIMEOUT,
  });
  return (await sort.count()) > 0;
}

test.describe("materi library — member (storage state)", () => {
  test("B1. /materi: rows, a count and a sort control — no gate", async ({ page }) => {
    await page.goto(`/k/${TENANT}/materi`);
    const loaded = await libraryLoaded(page, /Belum ada materi di komunitas ini/);
    // The gate check comes AFTER a positive marker: toHaveCount(0) is trivially
    // true of a page that has not rendered yet.
    await expectNoGate(page);
    test.skip(!loaded, "Perpustakaan materi kosong di deployment ini — tidak ada baris untuk diuji.");

    // "<n> materi" — LibraryToolbar, aria-live, with a trailing "+" while a
    // cursor remains. It is the proof the paginated member read answered.
    await expect(page.getByText(/^\d+ materi\+?$/).first()).toBeVisible();
    await expect(page.locator(`main ul li a[href*="/materi/"]`).first()).toBeVisible();
    await expectNoCrash(page);
  });

  test("B2. a row opens its permalink and the member sees the BODY", async ({ page }) => {
    await page.goto(`/k/${TENANT}/materi`);
    test.skip(
      !(await libraryLoaded(page, /Belum ada materi di komunitas ini/)),
      "Perpustakaan materi kosong di deployment ini."
    );

    const row = page.locator(`main ul li a[href*="/materi/"]`).first();
    // The row must lead to the CANONICAL permalink of that materi — compared by
    // href, not by title text: the theme uppercases display text via CSS, so a
    // text comparison is a comparison of two different renderings.
    const href = await row.getAttribute("href");
    await row.click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));

    // The island renders <article> — everything membership buys. Anon spec 15
    // asserts the exact opposite on the same URL.
    await expect(page.locator("main article")).toBeVisible({ timeout: DATA_TIMEOUT });
    const heading = page.locator("main").getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    expect(((await heading.textContent()) ?? "").trim().length).toBeGreaterThan(0);
    await expectNoGate(page);
    await expectNoCrash(page);
  });

  test("B3. sort A→Z is a real toggle, not a decoration", async ({ page }) => {
    await page.goto(`/k/${TENANT}/materi`);
    test.skip(
      !(await libraryLoaded(page, /Belum ada materi di komunitas ini/)),
      "Perpustakaan materi kosong di deployment ini."
    );

    const sort = page.getByRole("group", { name: "Urutkan" });
    await expect(sort.getByRole("button", { name: "Terbaru" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await sort.getByRole("button", { name: "A→Z" }).click();
    await expect(sort.getByRole("button", { name: "A→Z" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(page.locator(`main ul li a[href*="/materi/"]`).first()).toBeVisible();
    await expectNoCrash(page);
  });

  test("B4. the materi filter box narrows the loaded rows and says when nothing matches", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}/materi`);
    test.skip(
      !(await libraryLoaded(page, /Belum ada materi di komunitas ini/)),
      "Perpustakaan materi kosong di deployment ini."
    );

    const box = page.getByLabel("Cari materi…");
    // Below 8 loaded rows the field is deliberately not rendered (SEARCH_FROM).
    test.skip((await box.count()) === 0, "Kurang dari 8 materi termuat — kotak filter memang disembunyikan.");

    await box.fill("zzq-tidak-akan-pernah-cocok");
    await expect(page.getByText(/Tidak ada materi yang cocok dengan/)).toBeVisible();
    await box.fill("");
    await expect(page.locator(`main ul li a[href*="/materi/"]`).first()).toBeVisible();
    await expectNoCrash(page);
  });
});

test.describe("skills library — member (storage state)", () => {
  test("B5. /skills: a member sees the library or the real explanation — never a gate", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}/skills`);
    // The field is ALWAYS rendered here (its search is a server query over the
    // prompt text), so it is the landing marker regardless of row count.
    await expect(page.getByLabel("Cari skill atau isi prompt…")).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expectNoGate(page);

    // Today the library is empty on purpose, so the launch screen IS the empty
    // state — and it has to teach what a skill is, not just say "kosong".
    const empty = page.getByText("Belum ada skill di sini");
    if ((await empty.count()) > 0) {
      await expect(empty).toBeVisible();
      await expect(page.getByText(/Skill itu satu prompt siap pakai/)).toBeVisible();
    } else {
      await expect(page.getByText(/^\d+ skill\+?$/).first()).toBeVisible();
      await expect(page.locator(`main ul li a[href*="/skills/"]`).first()).toBeVisible();
    }
    await expectNoCrash(page);
  });

  test("B6. skills search: too short is said out loud, no match is said out loud", async ({
    page,
  }) => {
    await page.goto(`/k/${TENANT}/skills`);
    const box = page.getByLabel("Cari skill atau isi prompt…");
    await expect(box).toBeVisible({ timeout: DATA_TIMEOUT });

    // 1 char is below the server's floor, so the client must not even ask.
    await box.fill("z");
    await expect(page.getByText("Ketik minimal 2 huruf.")).toBeVisible();
    // ≥2 chars is a real server query (title OR prompt text).
    await box.fill("zzq-tidak-akan-pernah-cocok");
    await expect(page.getByText(/Tidak ada skill yang cocok dengan/)).toBeVisible({
      timeout: DATA_TIMEOUT,
    });
    await expectNoCrash(page);
  });

  test("B7. a skill page gives a member the PROMPT panel", async ({ page }) => {
    const paths = await sitemapPaths(page.request, new RegExp(`^/k/${TENANT}/skills/[^/]+$`));
    // Empty skills library ⇒ nothing to open. Flips itself on with the first
    // published skill; until then this is the surface that stays dark.
    test.skip(
      paths.length === 0,
      "Belum ada skill terbit — perpustakaan skill sengaja kosong (lihat e2e/README.md)."
    );

    await page.goto(paths[0]);
    const prompt = page.locator('section[aria-label="Prompt"]');
    await expect(prompt).toBeVisible({ timeout: DATA_TIMEOUT });
    // Either the prompt itself with its Salin button, or the honest "belum
    // diisi" — an empty hero is information, and both are correct states.
    const hasText = (await prompt.locator("pre").count()) > 0;
    if (hasText) {
      expect((await prompt.locator("pre").innerText()).trim().length).toBeGreaterThan(0);
      // Present, but NOT pressed: clicking asks the browser for clipboard
      // permission and proves nothing this spec is here for.
      await expect(prompt.getByRole("button", { name: "Salin" })).toBeVisible();
    } else {
      await expect(prompt.getByText("Prompt-nya belum diisi.")).toBeVisible();
    }
    await expectNoGate(page);
    await expectNoCrash(page);
  });
});
