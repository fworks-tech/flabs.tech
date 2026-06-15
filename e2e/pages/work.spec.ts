import { expect, test } from "@playwright/test";

test.describe("work page", () => {
  test("loads work experience page", async ({ page }) => {
    await page.goto("/work");
    await expect(page).toHaveTitle(/Work/);
  });

  test("has og meta tags", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
  });
});
