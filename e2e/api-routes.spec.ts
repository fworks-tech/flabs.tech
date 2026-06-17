import { expect, test } from "@playwright/test";

test.describe("API routes", () => {
  test("/api/rss returns XML", async ({ page }) => {
    const response = await page.goto("/api/rss");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] || "";
    expect(contentType).toContain("xml");
  });

  test("/api/og/generate returns image", async ({ page }) => {
    const response = await page.goto("/api/og/generate?title=Test");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] || "";
    expect(contentType).toContain("image");
  });

  test("/api/check-auth returns valid JSON", async ({ page }) => {
    const response = await page.goto("/api/check-auth");
    expect(response?.status()).toBe(200);
    const body = await response?.json();
    expect(body).toHaveProperty("authenticated");
  });
});
