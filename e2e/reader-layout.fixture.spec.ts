// Opt-in presentation checks; never uses production data, auth state or backend.
import { expect, test } from "@playwright/test";

const fixtureURL = process.env.READER_FIXTURE_URL;
if (fixtureURL && !["localhost", "127.0.0.1", "[::1]"].includes(new URL(fixtureURL).hostname)) {
  throw new Error("READER_FIXTURE_URL must point to the local disconnected reader fixture");
}
test.use({ baseURL: fixtureURL ?? "http://127.0.0.1:3012", viewport: { width: 1440, height: 900 }, storageState: { cookies: [], origins: [] } });
test.skip(!fixtureURL, "Set READER_FIXTURE_URL for the local presentation harness");
test.beforeEach(async ({ page }) => {
  await page.route(/https?:\/\/[^/]+\.convex\.(cloud|site)/, route => route.abort());
});

test("desktop reader and syllabus scroll separately; final lesson is keyboard reachable", async ({ page }) => {
  await page.goto("/");
  const nav = page.locator('aside[aria-label="Silabus kelas"] nav');
  const reading = page.getByRole("region", { name: "Bacaan dan diskusi" });
  await expect(nav.getByRole("link")).toHaveCount(40);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Kembali ke kelas" })).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBe(900);
  await nav.hover();
  await page.mouse.wheel(0, 900);
  await expect.poll(() => nav.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await reading.evaluate(e => e.scrollTop)).toBe(0);
  await reading.hover();
  await page.mouse.wheel(0, 1200);
  await expect.poll(() => reading.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await nav.getByRole("link").first().focus();
  for (let i = 0; i < 39; i++) await page.keyboard.press("Tab");
  await expect(nav.getByRole("link").last()).toBeFocused();
  const visible = await nav.evaluate(e => {
    const last = e.querySelector("li:last-child a")!.getBoundingClientRect();
    const bounds = e.getBoundingClientRect();
    return last.bottom <= bounds.bottom + 1 && last.top >= bounds.top;
  });
  expect(visible).toBe(true);
});

for (const state of ["loading", "truncated"]) {
  test(`progress ${state} keeps unknown counts honest`, async ({ page }) => {
    await page.goto(`/?progress=${state}`);
    await expect(page.locator('aside[aria-label="Silabus kelas"]')).toContainText(state === "loading" ? "Memuat kemajuan…" : "Kemajuan belum lengkap");
    await expect(page.getByRole("progressbar", { name: "Kemajuan kelas" })).toHaveCount(0);
    await expect(page.locator('aside[aria-label="Silabus kelas"] nav')).not.toContainText("Materi berikutnya");
  });
}

test("failed comment submits once and retains the draft; failed delete retains confirmation", async ({ page }) => {
  await page.goto("/?failAdd=1&failDelete=1&delay=300");
  const composer = page.locator('textarea[aria-label="Komentar"]').first();
  await composer.fill("Draft lokal tetap tersimpan setelah kirim gagal");
  await composer.evaluate(e => { const form = e.closest("form")!; form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByText("Kegagalan kirim lokal untuk uji pemulihan")).toBeVisible();
  await expect(composer).toHaveValue("Draft lokal tetap tersimpan setelah kirim gagal");
  expect(await page.evaluate(() => (window as unknown as { __readerFixture: { calls: Record<string, number> } }).__readerFixture.calls["features/comments/comments:addComment"])).toBe(1);
  const first = page.getByRole("region", { name: "Komentar dan balasan" }).locator("li").first();
  await first.getByRole("button", { name: "Hapus", exact: true }).click();
  await page.getByRole("button", { name: "Ya, hapus" }).click();
  await expect(page.getByText("Kegagalan hapus lokal untuk uji pemulihan")).toBeVisible();
  await expect(page.getByRole("alertdialog")).toBeVisible();
});

test("lesson navigation resets root/reply drafts, delete confirmation and reading scroll", async ({ page }) => {
  await page.goto("/");
  const composer = page.locator('textarea[aria-label="Komentar"]').first();
  await composer.fill("Draft materi pertama");
  const first = page.getByRole("region", { name: "Komentar dan balasan" }).locator("li").first();
  await first.getByRole("button", { name: "Balas", exact: true }).click();
  await page.getByPlaceholder("Tulis balasanmu…").fill("Balasan materi pertama");
  await first.getByRole("button", { name: "Hapus", exact: true }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.evaluate(() => { history.pushState(null, "", "?lesson=lesson-2"); dispatchEvent(new PopStateEvent("popstate")); });
  await expect(page.getByRole("alertdialog")).toHaveCount(0);
  await expect(composer).toHaveValue("");
  await expect(page.getByPlaceholder("Tulis balasanmu…")).toHaveCount(0);
  expect(await page.getByRole("region", { name: "Bacaan dan diskusi" }).evaluate(e => e.scrollTop)).toBe(0);
});

test("long comments have keyboard access and contained scrolling", async ({ page }) => {
  await page.goto("/");
  const comments = page.getByRole("region", { name: "Komentar dan balasan" });
  await comments.scrollIntoViewIfNeeded();
  await comments.getByRole("button").first().focus();
  for (let i = 0; i < 79; i++) await page.keyboard.press("Tab");
  await expect(comments.getByRole("button").last()).toBeFocused();
  expect(await comments.evaluate(e => e.scrollTop)).toBeGreaterThan(0);
  expect(await comments.evaluate(e => e.scrollWidth <= e.clientWidth)).toBe(true);
  expect(await page.evaluate(() => scrollY)).toBe(0);
});

test("mobile syllabus disclosure and completion clear dock with bottom safe area", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
  await page.locator("details summary").click();
  const nav = page.locator("details nav");
  await expect(nav).toBeVisible();
  expect(await nav.evaluate(e => e.scrollHeight > e.clientHeight)).toBe(true);
  await page.locator("details summary").click();
  for (const safe of [0, 20]) {
    await page.evaluate(value => document.body.style.setProperty("--safe-b", `${value}px`), safe);
    const button = page.getByRole("button", { name: "Tandai selesai", exact: true });
    await button.scrollIntoViewIfNeeded();
    const box = await button.boundingBox();
    const dock = await page.getByRole("navigation", { name: "Navigasi cepat" }).boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test("mobile quiz submit stays reachable, shows result, and retry clears answers", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/?mode=quiz");
  await expect(page.getByRole("link", { name: "Kembali ke kelas" })).toHaveCount(1);
  const groups = page.locator("fieldset");
  await expect(groups).toHaveCount(12);
  for (let i = 0; i < 12; i++) await groups.nth(i).getByRole("radio").first().check();
  const submit = page.getByRole("button", { name: "Kirim jawaban", exact: true });
  for (const safe of [0, 20]) {
    await page.evaluate(value => document.body.style.setProperty("--safe-b", `${value}px`), safe);
    await submit.scrollIntoViewIfNeeded();
    const box = await submit.boundingBox();
    const dock = await page.getByRole("navigation", { name: "Navigasi cepat" }).boundingBox();
    expect(box!.y + box!.height).toBeLessThanOrEqual(dock!.y);
  }
  await submit.click();
  await expect(page.getByRole("heading", { name: "Nilaimu", exact: true })).toBeVisible();
  await expect(page.getByText("100%", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Coba lagi", exact: true }).click();
  await expect(groups).toHaveCount(12);
  await expect(page.locator("input:checked")).toHaveCount(0);
  await expect(submit).toBeDisabled();
});
