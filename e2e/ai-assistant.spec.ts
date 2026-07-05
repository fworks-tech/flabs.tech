import { expect, test } from "@playwright/test";

test.describe("AI assistant", () => {
  test("chat toggle button is visible on homepage", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label="Open AI assistant"]');
    await expect(toggle).toBeVisible();
  });

  test("opens chat panel on toggle click", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();
    const panel = page.getByText("AI Assistant", { exact: true });
    await expect(panel).toBeVisible();
  });

  test("shows welcome message when opened", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();
    await expect(page.locator("text=Fabio's AI assistant")).toBeVisible();
  });

  test("closes chat panel on close button click", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();
    await expect(page.getByText("AI Assistant", { exact: true })).toBeVisible();

    await page.locator('button[aria-label="Close AI assistant"]').click();
    await expect(page.getByText("AI Assistant", { exact: true })).not.toBeVisible();
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeDisabled();
  });

  test("send button is enabled when input has text", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const textarea = page.locator("textarea");
    await textarea.fill("What experience do you have?");

    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).toBeEnabled();
  });

  test("clears input after sending a message", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const textarea = page.locator("textarea");
    await textarea.fill("Hello");
    await page.locator('button[aria-label="Send message"]').click();

    await expect(textarea).toHaveValue("");
  });

  test("user message appears in chat after sending", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const textarea = page.locator("textarea");
    await textarea.fill("What experience do you have?");
    await page.locator('button[aria-label="Send message"]').click();

    await expect(page.locator("text=What experience do you have?")).toBeVisible();
  });

  test("hides toggle button when panel is open", async ({ page }) => {
    await page.goto("/");
    const toggle = page.locator('button[aria-label="Open AI assistant"]');
    await toggle.click();
    await expect(toggle).toBeHidden();
  });

  test("Enter key sends message", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const textarea = page.locator("textarea");
    await textarea.fill("What skills do you have?");
    await textarea.press("Enter");

    await expect(page.locator("text=What skills do you have?")).toBeVisible();
  });

  test("Shift+Enter does not send message", async ({ page }) => {
    await page.goto("/");
    await page.locator('button[aria-label="Open AI assistant"]').click();

    const textarea = page.locator("textarea");
    await textarea.fill("Still typing");
    await textarea.press("Shift+Enter");

    const sendButton = page.locator('button[aria-label="Send message"]');
    await expect(sendButton).not.toBeDisabled();
  });
});
