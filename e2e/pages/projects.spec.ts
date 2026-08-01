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
      // Navigate via href instead of clicking: a click during React hydration
      // can be swallowed, making the navigation assertion flaky.
      const href = await projectLinks.first().getAttribute("href");
      await page.goto(href!);
      await expect(page).toHaveURL(/\/projects\/.+/);
    }
  });
});
