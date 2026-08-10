import { expect, test } from "./fixtures";

const staticRoutes = ["/", "/about", "/blog", "/work", "/projects"];

test.describe("mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of staticRoutes) {
    test(`${route} hamburger menu button is visible and within bounds`, async ({ page }) => {
      await page.goto(route);

      // The floating nav pill was replaced by a hamburger: the header itself
      // is hidden on mobile, the hamburger is the single nav entry point.
      await expect(page.locator("header")).toBeHidden();
      const hamburger = page.locator('[aria-label="Open navigation menu"]');
      await expect(hamburger).toBeVisible();

      const box = await hamburger.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });
  }

  for (const route of staticRoutes) {
    test(`${route} hamburger menu shows all nav links`, async ({ page }) => {
      await page.goto(route);
      await page.locator('[aria-label="Open navigation menu"]').click();

      const links = page.locator('nav[aria-label="Mobile navigation"] a');
      await expect(links.first()).toBeVisible();
      const count = await links.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });
  }
});

test.describe("dark mode toggle", () => {
  for (const route of staticRoutes) {
    test(`${route} switches theme on toggle click`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const html = page.locator("html");
      const initial = await html.getAttribute("data-mantine-color-scheme");
      expect(["dark", "light"]).toContain(initial);

      const toggle = page.locator('[aria-label*="Switch to"]').filter({ visible: true });
      await expect(toggle).toBeVisible();
      await toggle.click();

      const updated = await html.getAttribute("data-mantine-color-scheme");
      expect(updated).not.toBe(initial);
    });
  }
});
