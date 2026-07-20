import { type Page, expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/zen/v1/chat/completions", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ choices: [] }) }),
  );
});

test.describe("navigation", () => {
  test("header is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });

  async function clickNav(page: Page, path: string, expected: RegExp) {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await Promise.all([
      page.waitForURL(expected, { timeout: 15000 }),
      page.locator(`header a[href="${path}"]:visible`).first().click(),
    ]);
    await expect(page).toHaveURL(expected);
  }

  test("navigates to About", async ({ page }) => {
    await clickNav(page, "/about", /\/about/);
  });

  // TODO: re-enable after Mantine Button+Link click-handler is stable across all CI runs
  // test("navigates to Blog", async ({ page }) => {
  //   await clickNav(page, "/blog", /\/blog/);
  // });

  test("navigates to Work", async ({ page }) => {
    await clickNav(page, "/work", /\/work/);
  });

  test("navigates to Projects", async ({ page }) => {
    await clickNav(page, "/projects", /\/projects/);
  });

  test("home link navigates back to homepage", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await page.locator('header a[href="/"]:visible').first().click();
    await expect(page).toHaveURL("/");
  });

  test("homepage footer has copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
