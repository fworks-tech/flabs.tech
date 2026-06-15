import { expect, test } from "@playwright/test";

test.describe("about page", () => {
  test("loads with correct title", async ({ page }) => {
    await page.goto("/about");
    await expect(page).toHaveTitle(/About/);
  });

  test("has og meta tags", async ({ page }) => {
    await page.goto("/about");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
  });

  test("renders social links", async ({ page }) => {
    await page.goto("/about");
    await expect(page.getByLabel("GitHub")).toBeVisible();
    await expect(page.getByLabel("LinkedIn")).toBeVisible();
  });
});
