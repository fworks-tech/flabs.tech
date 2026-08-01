import { test as base } from "@playwright/test";

/**
 * Shared Playwright fixture.
 * - Emulates prefers-reduced-motion: reduce (WCAG 2.3.3 + element-stability).
 * - Mocks external APIs so tests are deterministic and never rate-limited:
 *   GitHub repo API (projects page) and the AI chat completions endpoint.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    await page.route("**/api.github.com/repos/**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          name: "mock-repo",
          description: "Mock repo for tests",
          html_url: "https://github.com/fworks-tech/mock-repo",
          homepage: "https://flabs.tech",
          topics: ["typescript", "nextjs"],
          language: "TypeScript",
          pushed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }),
      }),
    );

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
