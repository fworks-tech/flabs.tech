import { test as base } from "@playwright/test";

/**
 * Shared Playwright fixture.
 * - Emulates prefers-reduced-motion: reduce (WCAG 2.3.3 + element-stability).
 * - Mocks the AI chat completions endpoint (the projects page GitHub API is
 *   mocked server-side via the `E2E_GITHUB_MOCK` webServer env instead —
 *   page.route cannot intercept server-side fetches).
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.route("**/zen/go/v1/chat/completions", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ choices: [] }),
      }),
    );

    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect } from "@playwright/test";
