import { expect, test } from "@playwright/test";

const staticRoutes = ["/", "/about", "/blog", "/work", "/projects"];

test.describe("mobile viewport (375px)", () => {
  test.use({ viewport: { width: 375, height: 812 } });

  for (const route of staticRoutes) {
    test(`${route} nav pill is visible and within bounds`, async ({ page }) => {
      await page.goto(route);
      const header = page.locator("header");
      await expect(header).toBeVisible();

      const box = await header.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x + box!.width).toBeLessThanOrEqual(375);
    });
  }

  for (const route of staticRoutes) {
    test(`${route} all mobile nav icons are visible`, async ({ page }) => {
      await page.goto(route);
      const navItems = page.locator("header nav a:visible, header nav button:visible");
      const count = await navItems.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });
  }
});

test.describe("dark mode toggle", () => {
  for (const route of staticRoutes) {
    test(`${route} switches theme on toggle click`, async ({ page }) => {
      await page.goto(route, { waitUntil: "networkidle" });
      const html = page.locator("html");
      const initial = await html.getAttribute("data-theme");
      expect(["dark", "light"]).toContain(initial);

      const toggle = page.locator('[aria-label*="Switch to"]');
      await expect(toggle).toBeVisible();
      await toggle.click();

      const updated = await html.getAttribute("data-theme");
      expect(updated).not.toBe(initial);
    });
  }
});
