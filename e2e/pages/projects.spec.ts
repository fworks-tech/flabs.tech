import { expect, test } from "@playwright/test";

test.describe("projects page", () => {
  test("loads projects listing", async ({ page }) => {
    await page.goto("/projects");
    await expect(page).toHaveTitle(/Projects/);
  });

  test("has og meta tags", async ({ page }) => {
    await page.goto("/projects");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
  });

  test("navigates to a project detail", async ({ page }) => {
    await page.goto("/projects");
    const projectLinks = page.locator('a[href*="/projects/"]');
    const count = await projectLinks.count();
    if (count > 0) {
      await projectLinks.first().click();
      await expect(page).toHaveURL(/\/projects\/.+/);
    }
  });
});
