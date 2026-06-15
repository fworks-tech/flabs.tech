import { expect, test } from "@playwright/test";

test.describe("home page", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Portfolio/);
  });

  test("has favicon", async ({ page }) => {
    await page.goto("/");
    const favicon = page.locator('link[rel="icon"], link[rel="shortcut icon"]');
    await expect(favicon.first()).toBeAttached();
  });

  test("has og meta tags", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content");
  });
});
