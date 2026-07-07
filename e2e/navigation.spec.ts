import { expect, test } from "@playwright/test";
import { mockAiApi } from "./global-setup";

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

  async function clickNav(page: any, path: string, expected: RegExp) {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await Promise.all([
      page.waitForURL(expected, { timeout: 15000 }),
      page.locator(`a[href="${path}"]`).first().click(),
    ]);
    await expect(page).toHaveURL(expected);
  }

  test("navigates to About", async ({ page }) => {
    await clickNav(page, "/about", /\/about/);
  });

  test("navigates to Blog", async ({ page }) => {
    await clickNav(page, "/blog", /\/blog/);
  });

  test("navigates to Work", async ({ page }) => {
    await clickNav(page, "/work", /\/work/);
  });

  test("navigates to Projects", async ({ page }) => {
    await clickNav(page, "/projects", /\/projects/);
  });

  test("home link navigates back to homepage", async ({ page }) => {
    await page.goto("/about");
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: "Home", exact: true }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("homepage footer has copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
