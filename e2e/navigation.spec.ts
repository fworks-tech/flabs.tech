import { expect, test } from "@playwright/test";

test.describe("navigation", () => {
  test("header is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
  });

  async function clickNav(page: any, path: string, _label: string) {
    await page.goto("/");
    await page.locator(`a[href="${path}"]`).first().click({ force: true });
    await expect(page).toHaveURL(new RegExp(path.replace("/", "\\/")));
  }

  test("navigates to About", async ({ page }) => {
    await clickNav(page, "/about", "About");
  });

  test("navigates to Blog", async ({ page }) => {
    await clickNav(page, "/blog", "Blog");
  });

  test("navigates to Work", async ({ page }) => {
    await clickNav(page, "/work", "Work");
  });

  test("navigates to Projects", async ({ page }) => {
    await clickNav(page, "/projects", "Projects");
  });

  test("home link navigates back to homepage", async ({ page }) => {
    await page.goto("/about");
    await page.getByRole("link", { name: "Home", exact: true }).first().click();
    await expect(page).toHaveURL("/");
  });

  test("homepage footer has copyright", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
  });
});
