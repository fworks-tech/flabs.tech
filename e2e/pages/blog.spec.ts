import { expect, test } from "@playwright/test";

test.describe("blog page", () => {
  test("loads blog listing", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveTitle(/Blog/);
  });

  test("has og meta tags", async ({ page }) => {
    await page.goto("/blog");
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
  });

  test("navigates to a blog post", async ({ page }) => {
    await page.goto("/blog");
    const postLinks = page.locator('a[href*="/blog/"]');
    const count = await postLinks.count();
    if (count > 0) {
      await postLinks.first().click();
      await expect(page).toHaveURL(/\/blog\/.+/);
    }
  });
});
