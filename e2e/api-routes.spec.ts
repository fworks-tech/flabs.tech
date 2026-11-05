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

  test("/api/quiz/start issues a run", async ({ request }) => {
    const response = await request.post("/api/quiz/start");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.runId).toBe("string");
    expect(typeof body.seed).toBe("number");
  });
});
