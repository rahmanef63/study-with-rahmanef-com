// Read-only browser acceptance for the public learner surface and shell.
import { expect, test } from "@playwright/test";
import { COURSE, DATA_TIMEOUT, TENANT, expectNoCrash } from "./helpers";

const routes = [
  { name: "landing", path: "/" },
  { name: "community", path: `/k/${TENANT}` },
  { name: "course", path: `/k/${TENANT}/kelas/${COURSE}` },
];
const viewports = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 375, height: 812 },
];

for (const viewport of viewports) {
  test(`${viewport.name}: public pages retain one title, complete assets and contained layout`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      const title = page.getByRole("heading", { level: 1 });
      await expect(title).toHaveCount(1, { timeout: DATA_TIMEOUT });
      await expect(title).toBeVisible();
      await expectNoCrash(page);
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => [...document.images]
        .filter((image) => image.getBoundingClientRect().width > 0)
        .every((image) => image.complete && image.naturalWidth > 0))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const box = await title.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
      await page.screenshot({ path: testInfo.outputPath(`${route.name}-${viewport.name}.png`), fullPage: true });
    }
  });

  test(`${viewport.name}: keyboard skips shell navigation and moves focus into main`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(`/k/${TENANT}/kelas/${COURSE}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: DATA_TIMEOUT });
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Lewati navigasi" });
    await expect(skip).toBeFocused();
    await expect(skip).toBeVisible();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });
}

test("reduced motion disables page animations and transitions", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`/k/${TENANT}/kelas/${COURSE}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: DATA_TIMEOUT });
  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(true);
  const moving = await page.evaluate(() => [...document.querySelectorAll("*")].filter((element) => {
    const style = getComputedStyle(element);
    return [style.animationDuration, style.transitionDuration]
      .some((duration) => duration.split(",").some((value) => parseFloat(value) > 0.001));
  }).map((element) => element.tagName));
  expect(moving).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath("course-reduced-motion.png"), fullPage: true });
});
