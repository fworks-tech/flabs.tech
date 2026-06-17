import { expect, test } from "@playwright/test";

test.describe("auxiliary routes", () => {
  test("/robots.txt returns 200", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
    const text = await response?.text();
    expect(text).toContain("User-Agent");
  });

  test("/sitemap.xml returns 200", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
    const contentType = response?.headers()["content-type"] || "";
    expect(contentType).toContain("xml");
  });

  test("/favicon.ico returns 200", async ({ page }) => {
    const response = await page.goto("/favicon.ico");
    expect(response?.status()).toBe(200);
  });
});
