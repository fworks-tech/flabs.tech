import { expect, test } from "@playwright/test";

test.describe("invalid slug 404s", () => {
  test("/blog/nonexistent returns 404", async ({ page }) => {
    const response = await page.goto("/blog/nonexistent");
    expect(response?.status()).toBe(404);
  });

  test("/projects/nonexistent returns 404", async ({ page }) => {
    const response = await page.goto("/projects/nonexistent");
    expect(response?.status()).toBe(404);
  });

  test("/work/nonexistent returns 404", async ({ page }) => {
    const response = await page.goto("/work/nonexistent");
    expect(response?.status()).toBe(404);
  });
});
