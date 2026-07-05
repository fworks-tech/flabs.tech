import { expect, test } from "@playwright/test";

const STABLE_CSS = `
  canvas { display: none !important; }
  [data-visible] { animation: none !important; opacity: 1 !important; }
  *, *::before, *::after { animation-duration: 0s !important; animation-delay: 0s !important; transition-duration: 0s !important; transition-delay: 0s !important; }
`;

test.describe("AI assistant visual snapshots", () => {
  test("closed state with toggle button visible", async ({ page }) => {
    await page.addStyleTag({ content: STABLE_CSS });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    const toggle = page.locator('button[aria-label="Open AI assistant"]');
    await expect(toggle).toBeVisible();
    await expect(page).toHaveScreenshot("ai-assistant-closed.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("open state with welcome message", async ({ page }) => {
    await page.addStyleTag({ content: STABLE_CSS });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    await page.locator('button[aria-label="Open AI assistant"]').click();
    await expect(page.locator("text=AI Assistant")).toBeVisible();

    await expect(page).toHaveScreenshot("ai-assistant-open.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("open state with user input", async ({ page }) => {
    await page.addStyleTag({ content: STABLE_CSS });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    await page.locator('button[aria-label="Open AI assistant"]').click();
    const textarea = page.locator("textarea");
    await textarea.fill("What experience do you have?");

    await expect(page).toHaveScreenshot("ai-assistant-input.png", {
      maxDiffPixelRatio: 0.01,
    });
  });

  test("open state with sent message", async ({ page }) => {
    await page.addStyleTag({ content: STABLE_CSS });
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    await page.waitForLoadState("networkidle");

    await page.locator('button[aria-label="Open AI assistant"]').click();
    const textarea = page.locator("textarea");
    await textarea.fill("Hello");
    await page.locator('button[aria-label="Send message"]').click();

    await expect(page.locator("text=Hello")).toBeVisible();
    await expect(page).toHaveScreenshot("ai-assistant-message-sent.png", {
      maxDiffPixelRatio: 0.01,
    });
  });
});
