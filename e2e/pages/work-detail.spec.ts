import { expect, test } from "@playwright/test";

const slugs = ["agenthood", "flabs-tech", "verihire"];

test.describe("work detail pages", () => {
  for (const slug of slugs) {
    test(`/work/${slug} loads with correct title`, async ({ page }) => {
      await page.goto(`/work/${slug}`);
      await expect(page).toHaveTitle(/.+/);
      await expect(page.locator("h1")).toBeVisible();
    });

    test(`/work/${slug} has og meta tags`, async ({ page }) => {
      await page.goto(`/work/${slug}`);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content");
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content");
    });
  }
});
