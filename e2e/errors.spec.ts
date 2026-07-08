import { expect, test } from "@playwright/test";

test.describe("invalid slug 404s", () => {
  test("/blog/nonexistent shows not-found page", async ({ page }) => {
    await page.goto("/blog/nonexistent");
    await expect(page.locator("text=404")).toBeVisible();
  });

  test("/projects/nonexistent shows not-found page", async ({ page }) => {
    await page.goto("/projects/nonexistent");
    await expect(page.locator("text=404")).toBeVisible();
  });

  // TODO: re-enable after work/[slug] error boundary is verified
  // test("/work/nonexistent shows not-found page", async ({ page }) => {
  //   await page.goto("/work/nonexistent");
  //   await expect(page.locator("text=404")).toBeVisible();
  // });
});
