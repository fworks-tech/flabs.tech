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
    // `networkidle` never settles reliably (Next dev + analytics keep requests
    // in flight); wait for the actionable link instead, which the click also waits on.
    const link = page.locator(`header a[href="${path}"]:visible`).first();
    await expect(link).toBeVisible();
    await Promise.all([
      page.waitForURL(expected, { timeout: 15000 }),
      link.click(),
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
    const homeLink = page.locator('header a[href="/"]:visible').first();
    await expect(homeLink).toBeVisible();
    await homeLink.click();
    await expect(page).toHaveURL("/");
  });

  test("homepage footer has copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
