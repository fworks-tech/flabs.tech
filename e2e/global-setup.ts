import { type Page } from "@playwright/test";

export async function mockAiApi(page: Page) {
  await page.route("**/zen/go/v1/chat/completions", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ choices: [] }),
    }),
  );
}
