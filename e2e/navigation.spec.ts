import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("header is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });

  test("navigates to About", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/about"], button:has-text("About")').first().click();
    await expect(page).toHaveURL(/\/about/);
  });

  test("navigates to Blog", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/blog"], button:has-text("Blog")').first().click();
    await expect(page).toHaveURL(/\/blog/);
  });

  test("navigates to Work", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/work"], button:has-text("Work")').first().click();
    await expect(page).toHaveURL(/\/work/);
  });

  test("navigates to Projects", async ({ page }) => {
    await page.goto("/");
    await page.locator('a[href="/projects"], button:has-text("Projects")').first().click();
    await expect(page).toHaveURL(/\/projects/);
  });

  test("home link navigates back to homepage", async ({ page }) => {
    await page.goto("/about");
    await page.locator('a[href="/"], button:has-text("Home")').first().click();
    await expect(page).toHaveURL("/");
  });

  test("homepage footer has copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
